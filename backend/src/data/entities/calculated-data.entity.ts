// src/data/entities/calculated-data.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CalculatedData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  player_id: number;

  @Column('float')
  total_distance: number;

  @Column('float')
  hsr_distance: number;

  @Column('float')
  sprint_distance: number;

  @Column('float')
  top_speed: number;

  @Column('int')
  sprint_count: number;

  @Column('int')
  accelerations: number;

  @Column('int')
  decelerations: number;

  @Column('float')
  max_acceleration: number;

  @Column('float')
  max_deceleration: number;

  @Column('float')
  player_load: number;

  @Column('float')
  power_score: number;

  @Column('float')
  hr_max: number;

  @Column('float')
  time_in_red_zone: number;

  @Column('float')
  percent_in_red_zone: number;

  @Column('float')
  hr_recovery_time: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
