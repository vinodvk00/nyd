import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Track } from './track.entity';

@Entity('projects')
export class Project {
  @Column({ primary: true })
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @OneToMany(() => Track, (track) => track.project)
  tracks: Track[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
