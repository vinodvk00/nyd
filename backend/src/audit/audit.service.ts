import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit, AuditStatus } from './entities/audit.entity';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(Audit)
    private auditRepository: Repository<Audit>,
  ) {}

  async create(createAuditDto: CreateAuditDto): Promise<Audit> {
    const activeAudit = await this.auditRepository.findOne({
      where: { status: AuditStatus.ACTIVE },
    });

    if (activeAudit) {
      throw new ConflictException(
        'An active audit already exists. Complete or abandon it before starting a new one.',
      );
    }

    const existingAudit = await this.auditRepository.findOne({
      where: {
        month: createAuditDto.month,
        year: createAuditDto.year,
      },
    });

    if (existingAudit) {
      throw new ConflictException(
        `An audit for ${this.getMonthName(createAuditDto.month)} ${createAuditDto.year} already exists.`,
      );
    }

    const startDate = new Date(createAuditDto.year, createAuditDto.month - 1, 1);
    const endDate = new Date(createAuditDto.year, createAuditDto.month, 0); // Last day of month

    const durationDays = endDate.getDate();

    const name =
      createAuditDto.name ||
      `${this.getMonthName(createAuditDto.month)} ${createAuditDto.year} Audit`;

    const audit = this.auditRepository.create({
      ...createAuditDto,
      name,
      startDate,
      endDate,
      durationDays,
      status: AuditStatus.ACTIVE,
    });

    return this.auditRepository.save(audit);
  }

  private getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1];
  }

  async findAll(status?: AuditStatus): Promise<Audit[]> {
    const where = status ? { status } : {};
    const audits = await this.auditRepository.find({
      where,
      order: {
        startDate: 'DESC',
      },
    });

    for (const audit of audits) {
      if (audit.month === null || audit.year === null) {
        const startDate = new Date(audit.startDate);
        audit.month = startDate.getMonth() + 1;
        audit.year = startDate.getFullYear();
        await this.auditRepository.save(audit);
      }
    }

    return audits.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });
  }

  async findActive(): Promise<Audit | null> {
    return this.auditRepository.findOne({
      where: { status: AuditStatus.ACTIVE },
      relations: ['entries'],
    });
  }

  async findOne(id: string): Promise<Audit> {
    const audit = await this.auditRepository.findOne({
      where: { id },
      relations: ['entries'],
    });

    if (!audit) {
      throw new NotFoundException(`Audit with ID ${id} not found`);
    }

    return audit;
  }

  async update(id: string, updateAuditDto: UpdateAuditDto): Promise<Audit> {
    const audit = await this.findOne(id);

    if (updateAuditDto.month || updateAuditDto.year) {
      const month = updateAuditDto.month ?? audit.month;
      const year = updateAuditDto.year ?? audit.year;

      const existingAudit = await this.auditRepository.findOne({
        where: { month, year },
      });

      if (existingAudit && existingAudit.id !== id) {
        throw new ConflictException(
          `An audit for ${this.getMonthName(month)} ${year} already exists.`,
        );
      }

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const durationDays = endDate.getDate();

      const defaultName = `${this.getMonthName(audit.month)} ${audit.year} Audit`;
      const newName =
        audit.name === defaultName || !updateAuditDto.name
          ? `${this.getMonthName(month)} ${year} Audit`
          : updateAuditDto.name;

      Object.assign(audit, {
        ...updateAuditDto,
        month,
        year,
        startDate,
        endDate,
        durationDays,
        name: newName,
      });
    } else {
      Object.assign(audit, updateAuditDto);
    }

    return this.auditRepository.save(audit);
  }

  async complete(id: string): Promise<Audit> {
    const audit = await this.findOne(id);

    if (audit.status !== AuditStatus.ACTIVE) {
      throw new BadRequestException('Only active audits can be completed');
    }

    // Calculate completion percentage
    const totalExpectedHours = audit.durationDays * 24;
    const entries = audit.entries || [];
    const hoursLogged = entries.reduce(
      (sum, entry) => sum + entry.durationMinutes / 60,
      0,
    );
    const completionPercentage = (hoursLogged / totalExpectedHours) * 100;

    if (completionPercentage < 70) {
      throw new BadRequestException(
        `Audit is only ${completionPercentage.toFixed(1)}% complete. Need at least 70% to mark as complete.`,
      );
    }

    audit.status = AuditStatus.COMPLETED;
    audit.completedAt = new Date();

    return this.auditRepository.save(audit);
  }

  async abandon(id: string): Promise<Audit> {
    const audit = await this.findOne(id);

    if (audit.status !== AuditStatus.ACTIVE) {
      throw new BadRequestException('Only active audits can be abandoned');
    }

    audit.status = AuditStatus.ABANDONED;

    return this.auditRepository.save(audit);
  }

  async remove(id: string): Promise<void> {
    const audit = await this.findOne(id);

    if (audit.entries && audit.entries.length > 0) {
      throw new BadRequestException(
        'Cannot delete audit with entries. Abandon it instead.',
      );
    }

    await this.auditRepository.remove(audit);
  }

  async getStats(id: string) {
    const audit = await this.findOne(id);
    const entries = audit.entries || [];

    const totalEntriesLogged = entries.length;
    const hoursLogged = entries.reduce(
      (sum, entry) => sum + entry.durationMinutes / 60,
      0,
    );

    const totalExpectedHours = audit.durationDays * 24;
    const completionPercentage = (hoursLogged / totalExpectedHours) * 100;

    return {
      totalEntriesLogged,
      hoursLogged: parseFloat(hoursLogged.toFixed(2)),
      completionPercentage: parseFloat(completionPercentage.toFixed(2)),
      totalExpectedHours,
    };
  }
}
