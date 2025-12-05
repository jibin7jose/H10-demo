import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RawData } from './entities/raw-data.entity';
import { CalculatedData } from './entities/calculated-data.entity';
import { CalculationService } from './calculation.service';
import { Readable } from 'stream';
import csvParser from 'csv-parser';

@Injectable()
export class CsvService {
  constructor(
    @InjectRepository(RawData)
    private rawRepo: Repository<RawData>,

    @InjectRepository(CalculatedData)
    private calcRepo: Repository<CalculatedData>,

    private readonly calculationService: CalculationService,
  ) {}

  async importCsvFromEsp32(ip: string, filename: string) {
    const url = `http://${ip}/download?file=${filename}`;
    console.log('\n📌 Fetching CSV from ESP32:', url);

    let response;
    try {
      response = await axios.get(url, { responseType: 'text' });
      console.log('✅ RAW CSV RESPONSE LENGTH:', response.data.length);
      console.log('✅ RAW CSV PREVIEW:\n', response.data.slice(0, 500));
    } catch (err) {
      console.error('❌ ESP32 HTTP Error:', err.message);
      throw new Error('ESP32 not reachable or download failed.');
    }

    if (!response.data || response.data.length === 0) {
      throw new Error('❌ CSV file empty on ESP32.');
    }

    const rows: any[] = [];
    const stream = Readable.from([response.data]);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csvParser({ mapHeaders: ({ header }) => header.trim() }))
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', async () => {
          if (rows.length === 0) {
            return reject(
              new Error('CSV parsed but no rows found — header mismatch?'),
            );
          }

          try {
            /* ================= RAW DATA ================= */

            const formattedRows: Partial<RawData>[] = rows.map((row) => ({
              player_id: Number(row.player_id),

              latitude: Number(row.lat),
              longitude: Number(row.lon),

              w: Number(row.gyro_w) || 0,
              x: Number(row.gyro_x) || 0,
              y: Number(row.gyro_y) || 0,
              z: Number(row.gyro_z) || 0,

              distance: Number(row.distance) || 0,
              speed: Number(row.speed) || 0,

              timestamp: row.timestamp
                ? new Date(Number(row.timestamp) * 1000)
                : new Date(),

              heartrate: row.heartrate ? Number(row.heartrate) : 0,
            }));

            console.log('🟢 Saving RAW data:', formattedRows.length, 'rows');

            const rawEntities = this.rawRepo.create(formattedRows);
            await this.rawRepo.save(rawEntities);

            /* ============== GROUP BY PLAYER ============== */

            const groupedByPlayer: Record<number, RawData[]> = {};

            for (const row of rawEntities) {
              if (!groupedByPlayer[row.player_id]) {
                groupedByPlayer[row.player_id] = [];
              }
              groupedByPlayer[row.player_id].push(row);
            }

            let playersProcessed = 0;

            /* ============= CALCULATE + SAVE ============= */

            for (const playerId in groupedByPlayer) {
              const playerRows = groupedByPlayer[playerId];

              let calculated: Partial<CalculatedData> =
                this.calculationService.computeMetrics(playerRows);

              // ✅ DEFAULT VALUES IF EMPTY
              if (!calculated || Object.keys(calculated).length === 0) {
                calculated = {
                  player_id: Number(playerId),

                  total_distance: 0,
                  hsr_distance: 0,
                  sprint_distance: 0,
                  top_speed: 0,
                  sprint_count: 0,

                  accelerations: 0,
                  decelerations: 0,

                  max_acceleration: 0,
                  max_deceleration: 0,

                  player_load: 0,
                  power_score: 0,

                  hr_max: playerRows[0]?.heartrate || 0,
                  time_in_red_zone: 0,
                  percent_in_red_zone: 0,
                  hr_recovery_time: 0,
                };
              }

              // ✅ Convert to entity
              const entity = this.calcRepo.create(calculated);

              // ✅ Save to DB
              await this.calcRepo.save(entity);

              playersProcessed++;
            }

            console.log('✅ CALCULATED data saved for', playersProcessed, 'players');

            resolve({
              message:
                'CSV imported and calculated data generated successfully ✅',
              rowsInserted: formattedRows.length,
              playersCalculated: playersProcessed,
              filename,
            });

          } catch (err) {
            console.error('❌ Database Insert Error:', err);
            reject(new Error('Failed to save rows to database.'));
          }
        })
        .on('error', (err) => {
          console.error('❌ CSV Parsing Error:', err);
          reject(new Error('Error while parsing CSV.'));
        });
    });
  }
}
