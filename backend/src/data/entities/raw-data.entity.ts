// src/data/entities/raw-data.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RawData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  player_id: number;

  @Column('float')
  latitude: number;

  @Column('float')
  longitude: number;

  @Column('float')
  w: number;

  @Column('float')
  x: number;

  @Column('float')
  y: number;

  @Column('float')
  z: number;

  @Column('float')
  distance: number;

  @Column('float')
  speed: number;

  @Column('timestamp')
  timestamp: Date;

  @Column('float')
  heartrate: number;
}
