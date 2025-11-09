import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TimeEntry } from '../../time-entry/entities/time-entry.entity';

export enum AuditStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

@Entity('audits')
export class Audit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'int' })
  durationDays: number;

  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.ACTIVE,
  })
  status: AuditStatus;

  @Column({ type: 'text', nullable: true })
  goal: string;

  @OneToMany(() => TimeEntry, (entry) => entry.audit, { cascade: true })
  entries: TimeEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;
}
