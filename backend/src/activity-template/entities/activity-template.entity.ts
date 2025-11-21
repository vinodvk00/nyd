import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TimeEntry } from '../../time-entry/entities/time-entry.entity';

@Entity('activity_templates')
export class ActivityTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean' })
  isImportant: boolean;

  @Column({ type: 'boolean' })
  isUrgent: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  icon: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @OneToMany(() => TimeEntry, (entry) => entry.template)
  entries: TimeEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
