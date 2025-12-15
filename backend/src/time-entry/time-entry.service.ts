import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  /**
   * Get or create audit for a given date
   * Auto-creates monthly audit if it doesn't exist
   */
  private async getOrCreateAuditForDate(date: Date): Promise<Audit> {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    let audit = await this.auditRepository.findOne({
      where: { month, year },
    });

    if (!audit) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const durationDays = endDate.getDate();

      const monthNames = [
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
      const name = `${monthNames[month - 1]} ${year} Audit`;

      audit = this.auditRepository.create({
        name,
        month,
        year,
        startDate,
        endDate,
        durationDays,
        status: AuditStatus.ACTIVE,
      });

      audit = await this.auditRepository.save(audit);
    }

    return audit;
  }

  /**
   * Check if a new time entry overlaps with existing entries
   */
  private async checkOverlap(
    auditId: string,
    date: Date,
    startHour: number,
    startMinute: number,
    durationMinutes: number,
    excludeEntryId?: string,
  ): Promise<{ hasOverlap: boolean; conflictingEntry?: TimeEntry }> {
    const newStartTime = startHour * 60 + startMinute;
    const newEndTime = newStartTime + durationMinutes;

    if (newEndTime > 24 * 60) {
      throw new BadRequestException(
        'Activity extends beyond 24:00. Please split into multiple days.',
      );
    }

    const entries = await this.timeEntryRepository.find({
      where: { auditId, date },
    });

    for (const entry of entries) {
      if (excludeEntryId && entry.id === excludeEntryId) {
        continue;
      }

      const entryStartTime = entry.hourSlot * 60 + (entry.startMinute || 0);
      const entryEndTime = entryStartTime + entry.durationMinutes;

      if (newStartTime < entryEndTime && newEndTime > entryStartTime) {
        return { hasOverlap: true, conflictingEntry: entry };
      }
    }

    return { hasOverlap: false };
  }

  async create(createTimeEntryDto: CreateTimeEntryDto): Promise<TimeEntry> {
    const entryDate = new Date(createTimeEntryDto.date);

    const audit = await this.getOrCreateAuditForDate(entryDate);

    if (audit.status === AuditStatus.COMPLETED) {
      throw new BadRequestException('Cannot modify completed audit');
    }

    createTimeEntryDto.auditId = audit.id;

    const startMinute = createTimeEntryDto.startMinute || 0;
    const durationMinutes = createTimeEntryDto.durationMinutes || 60;

    const { hasOverlap, conflictingEntry } = await this.checkOverlap(
      createTimeEntryDto.auditId,
      entryDate,
      createTimeEntryDto.hourSlot,
      startMinute,
      durationMinutes,
    );

    if (hasOverlap && conflictingEntry) {
      throw new BadRequestException(
        `Time slot overlaps with existing entry: ${conflictingEntry.activityDescription} (${conflictingEntry.startTime} - ${conflictingEntry.endTime})`,
      );
    }

    const entry = this.timeEntryRepository.create({
      ...createTimeEntryDto,
      date: entryDate,
      startMinute,
      durationMinutes,
    });

    return this.timeEntryRepository.save(entry);
  }

  async batchCreate(batchDto: BatchCreateEntriesDto) {
    const entryDate = new Date(batchDto.date);

    const audit = await this.getOrCreateAuditForDate(entryDate);

    if (audit.status === AuditStatus.COMPLETED) {
      throw new BadRequestException('Cannot modify completed audit');
    }

    batchDto.auditId = audit.id;

    const created: TimeEntry[] = [];
    const errors: Array<{ hourSlot: number; error: string }> = [];

    for (const item of batchDto.entries) {
      try {
        const startMinute = item.startMinute || 0;
        const durationMinutes = item.durationMinutes || 60;

        const { hasOverlap, conflictingEntry } = await this.checkOverlap(
          batchDto.auditId,
          entryDate,
          item.hourSlot,
          startMinute,
          durationMinutes,
        );

        if (hasOverlap && conflictingEntry) {
          errors.push({
            hourSlot: item.hourSlot,
            error: `Overlaps with ${conflictingEntry.activityDescription} (${conflictingEntry.startTime} - ${conflictingEntry.endTime})`,
          });
          continue;
        }

        const entry = this.timeEntryRepository.create({
          auditId: batchDto.auditId,
          date: entryDate,
          ...item,
          startMinute,
          durationMinutes,
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
      order: { hourSlot: 'ASC', startMinute: 'ASC' },
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

    if (
      updateDto.hourSlot !== undefined ||
      updateDto.startMinute !== undefined ||
      updateDto.durationMinutes !== undefined
    ) {
      const hourSlot = updateDto.hourSlot ?? entry.hourSlot;
      const startMinute = updateDto.startMinute ?? entry.startMinute ?? 0;
      const durationMinutes = updateDto.durationMinutes ?? entry.durationMinutes;

      const { hasOverlap, conflictingEntry } = await this.checkOverlap(
        entry.auditId,
        entry.date,
        hourSlot,
        startMinute,
        durationMinutes,
        id,
      );

      if (hasOverlap && conflictingEntry) {
        throw new BadRequestException(
          `Updated time slot overlaps with existing entry: ${conflictingEntry.activityDescription} (${conflictingEntry.startTime} - ${conflictingEntry.endTime})`,
        );
      }
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
