import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RawData } from './entities/raw-data.entity';
import { CalculatedData } from './entities/calculated-data.entity';
import { CalculationService } from './calculation.service';

@Injectable()
export class WifiService {
  constructor(
    @InjectRepository(RawData)
    private readonly rawRepo: Repository<RawData>,

    @InjectRepository(CalculatedData)
    private readonly calcRepo: Repository<CalculatedData>,

    private readonly calculationService: CalculationService,
  ) {}

  // 🔹 Called from POST /data/upload
  async receiveDataFromESP32(data: any) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new BadRequestException('Invalid data received from ESP32');
    }

    try {
      console.log(`📡 Data received from ESP32: ${data.length} rows`);

      // 1️⃣ Format rows for RawData entity
      const formatted: Partial<RawData>[] = data.map((row: any) => ({
        player_id: Number(row.player_id) || 0,

        latitude: Number(row.lat) || 0,
        longitude: Number(row.lon) || 0,

        w: Number(row.gyro_w) || 0,
        x: Number(row.gyro_x) || 0,
        y: Number(row.gyro_y) || 0,
        z: Number(row.gyro_z) || 0,

        distance: Number(row.distance) || 0,
        speed: Number(row.speed) || 0,

        heartrate: Number(row.heartrate) || 0,

        // ✅ Convert UNIX timestamp to Date
        timestamp: row.timestamp
          ? new Date(Number(row.timestamp) * 1000)
          : new Date(),
      }));

      // 2️⃣ Save RAW DATA
      const rawEntities = this.rawRepo.create(formatted);
      const savedRaw = await this.rawRepo.save(rawEntities);

      console.log('✅ Raw data saved:', savedRaw.length);

      // 3️⃣ Calculate metrics
      let calculated = this.calculationService.computeMetrics(savedRaw);

      // 4️⃣ Force safe defaults (NO NULLS EVER)
      calculated = this.calcRepo.create({
        player_id: calculated?.player_id ?? savedRaw[0].player_id,

        total_distance: calculated?.total_distance ?? 0,
        hsr_distance: calculated?.hsr_distance ?? 0,
        sprint_distance: calculated?.sprint_distance ?? 0,
        top_speed: calculated?.top_speed ?? 0,
        sprint_count: calculated?.sprint_count ?? 0,

        accelerations: calculated?.accelerations ?? 0,
        decelerations: calculated?.decelerations ?? 0,
        max_acceleration: calculated?.max_acceleration ?? 0,
        max_deceleration: calculated?.max_deceleration ?? 0,

        player_load: calculated?.player_load ?? 0,
        power_score: calculated?.power_score ?? 0,

        hr_max: calculated?.hr_max ?? savedRaw[0].heartrate ?? 0,
        time_in_red_zone: calculated?.time_in_red_zone ?? 0,
        percent_in_red_zone: calculated?.percent_in_red_zone ?? 0,
        hr_recovery_time: calculated?.hr_recovery_time ?? 0,
      });

      // 5️⃣ Save calculated data
      const savedCalculated = await this.calcRepo.save(calculated);

      console.log('✅ Calculated data saved');

      return {
        message: 'Data received & processed successfully ✅',
        rowsInserted: savedRaw.length,
        calculated: savedCalculated,
      };

    } catch (err) {
      console.error('❌ WifiService error:', err);
      throw new BadRequestException(err.message);
    }
  }
}
