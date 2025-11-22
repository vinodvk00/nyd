import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Audit } from '../../audit/entities/audit.entity';
import { ActivityTemplate } from '../../activity-template/entities/activity-template.entity';

@Entity('time_entries')
@Index(['auditId', 'date'])
@Index(['auditId', 'isImportant', 'isUrgent'])
export class TimeEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Audit, (audit) => audit.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'auditId' })
  audit: Audit;

  @Column({ type: 'uuid' })
  auditId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'int' })
  hourSlot: number;

  @Column({ type: 'int', default: 0 })
  startMinute: number;

  @Column({ type: 'varchar', length: 255 })
  activityDescription: string;

  @Column({ type: 'int', default: 60 })
  durationMinutes: number;

  @Column({ type: 'boolean' })
  isImportant: boolean;

  @Column({ type: 'boolean' })
  isUrgent: boolean;

  @ManyToOne(() => ActivityTemplate, (template) => template.entries, {
    nullable: true,
  })
  @JoinColumn({ name: 'templateId' })
  template: ActivityTemplate;

  @Column({ type: 'uuid', nullable: true })
  templateId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get quadrant(): number {
    if (this.isImportant && this.isUrgent) return 1;
    if (this.isImportant && !this.isUrgent) return 2;
    if (!this.isImportant && this.isUrgent) return 3;
    return 4;
  }

  get startTimeInMinutes(): number {
    return this.hourSlot * 60 + (this.startMinute || 0);
  }

  get endTimeInMinutes(): number {
    return this.startTimeInMinutes + this.durationMinutes;
  }

  get startTime(): string {
    const hour = this.hourSlot.toString().padStart(2, '0');
    const minute = (this.startMinute || 0).toString().padStart(2, '0');
    return `${hour}:${minute}`;
  }

  get endTime(): string {
    const totalMinutes = this.endTimeInMinutes;
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  }
}
