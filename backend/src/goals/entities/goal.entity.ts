import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';

export enum GoalPriority {
  CRITICAL = 'critical',
  IMPORTANT = 'important',
  GROWTH = 'growth',
  HOBBY = 'hobby',
}

export enum TargetPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  purpose: string; // The "why" - gives meaning

  @Column({
    type: 'enum',
    enum: GoalPriority,
    default: GoalPriority.IMPORTANT,
  })
  priority: GoalPriority;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  targetHours: number;

  @Column({
    type: 'enum',
    enum: TargetPeriod,
    default: TargetPeriod.WEEKLY,
  })
  targetPeriod: TargetPeriod;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  minimumDaily: number; // Optional no-zero-days threshold

  @Column({ type: 'date', nullable: true })
  startDate: Date; // When to start counting

  @Column({ type: 'date', nullable: true })
  deadline: Date; // Optional end goal

  @Column('simple-array')
  tags: string[]; // Maps to Toggl tags

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Category, (category) => category.goals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
