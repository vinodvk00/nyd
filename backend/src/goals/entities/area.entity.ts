import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Category } from './category.entity';

@Entity('areas')
export class Area {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ default: 0 })
  order: number;

  @OneToMany(() => Category, (category) => category.area, {
    cascade: true,
  })
  categories: Category[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
