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

    const startDate = new Date(createAuditDto.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + createAuditDto.durationDays);

    const audit = this.auditRepository.create({
      ...createAuditDto,
      startDate,
      endDate,
      status: AuditStatus.ACTIVE,
    });

    return this.auditRepository.save(audit);
  }

  async findAll(status?: AuditStatus): Promise<Audit[]> {
    const where = status ? { status } : {};
    return this.auditRepository.find({
      where,
      order: { createdAt: 'DESC' },
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
