import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TimeEntry } from './entities/time-entry.entity';
import { Audit, AuditStatus } from '../audit/entities/audit.entity';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { BatchCreateEntriesDto } from './dto/batch-create-entries.dto';

@Injectable()
export class TimeEntryService {
  constructor(
    @InjectRepository(TimeEntry)
    private timeEntryRepository: Repository<TimeEntry>,
    @InjectRepository(Audit)
    private auditRepository: Repository<Audit>,
  ) {}

  async create(createTimeEntryDto: CreateTimeEntryDto): Promise<TimeEntry> {
    const audit = await this.auditRepository.findOne({
      where: { id: createTimeEntryDto.auditId },
    });

    if (!audit) {
      throw new NotFoundException('Audit not found');
    }

    if (audit.status === AuditStatus.COMPLETED) {
      throw new BadRequestException('Cannot modify completed audit');
    }

    const entryDate = new Date(createTimeEntryDto.date);
    if (entryDate < audit.startDate || entryDate > audit.endDate) {
      throw new BadRequestException('Date is outside audit date range');
    }

    const existing = await this.timeEntryRepository.findOne({
      where: {
        auditId: createTimeEntryDto.auditId,
        date: entryDate,
        hourSlot: createTimeEntryDto.hourSlot,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Hour slot ${createTimeEntryDto.hourSlot} is already filled for this date`,
      );
    }

    const entry = this.timeEntryRepository.create({
      ...createTimeEntryDto,
      date: entryDate,
      durationMinutes: createTimeEntryDto.durationMinutes || 60,
    });

    return this.timeEntryRepository.save(entry);
  }

  async batchCreate(batchDto: BatchCreateEntriesDto) {
    const audit = await this.auditRepository.findOne({
      where: { id: batchDto.auditId },
    });

    if (!audit) {
      throw new NotFoundException('Audit not found');
    }

    if (audit.status === AuditStatus.COMPLETED) {
      throw new BadRequestException('Cannot modify completed audit');
    }

    const entryDate = new Date(batchDto.date);
    if (entryDate < audit.startDate || entryDate > audit.endDate) {
      throw new BadRequestException('Date is outside audit date range');
    }

    const created: TimeEntry[] = [];
    const errors: Array<{ hourSlot: number; error: string }> = [];

    for (const item of batchDto.entries) {
      try {
        const existing = await this.timeEntryRepository.findOne({
          where: {
            auditId: batchDto.auditId,
            date: entryDate,
            hourSlot: item.hourSlot,
          },
        });

        if (existing) {
          errors.push({
            hourSlot: item.hourSlot,
            error: 'Hour slot already filled',
          });
          continue;
        }

        const entry = this.timeEntryRepository.create({
          auditId: batchDto.auditId,
          date: entryDate,
          ...item,
          durationMinutes: item.durationMinutes || 60,
        });

        const saved = await this.timeEntryRepository.save(entry);
        created.push(saved);
      } catch (error) {
        errors.push({
          hourSlot: item.hourSlot,
          error: error.message,
        });
      }
    }

    return { created, errors };
  }

  async findByAudit(auditId: string): Promise<TimeEntry[]> {
    return this.timeEntryRepository.find({
      where: { auditId },
      order: { date: 'ASC', hourSlot: 'ASC' },
      relations: ['template'],
    });
  }

  async findByDay(auditId: string, date: string) {
    const targetDate = new Date(date);
    const entries = await this.timeEntryRepository.find({
      where: {
        auditId,
        date: targetDate,
      },
      order: { hourSlot: 'ASC' },
      relations: ['template'],
    });

    const totalMinutesLogged = entries.reduce(
      (sum, entry) => sum + entry.durationMinutes,
      0,
    );

    const filledHours = new Set(entries.map((e) => e.hourSlot));
    const missingHours = Array.from({ length: 24 }, (_, i) => i).filter(
      (hour) => !filledHours.has(hour),
    );

    return {
      date,
      entries,
      totalMinutesLogged,
      missingHours,
    };
  }

  async findOne(id: string): Promise<TimeEntry> {
    const entry = await this.timeEntryRepository.findOne({
      where: { id },
      relations: ['template', 'audit'],
    });

    if (!entry) {
      throw new NotFoundException(`Time entry with ID ${id} not found`);
    }

    return entry;
  }

  async update(
    id: string,
    updateDto: Partial<CreateTimeEntryDto>,
  ): Promise<TimeEntry> {
    const entry = await this.findOne(id);

    if (entry.audit.status === AuditStatus.COMPLETED) {
      throw new BadRequestException('Cannot modify completed audit');
    }

    Object.assign(entry, updateDto);

    return this.timeEntryRepository.save(entry);
  }

  async remove(id: string): Promise<void> {
    const entry = await this.findOne(id);

    if (entry.audit.status === AuditStatus.COMPLETED) {
      throw new BadRequestException('Cannot modify completed audit');
    }

    await this.timeEntryRepository.remove(entry);
  }
}
