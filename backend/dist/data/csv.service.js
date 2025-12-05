"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const raw_data_entity_1 = require("./entities/raw-data.entity");
const calculated_data_entity_1 = require("./entities/calculated-data.entity");
const calculation_service_1 = require("./calculation.service");
const stream_1 = require("stream");
const csv_parser_1 = __importDefault(require("csv-parser"));
let CsvService = class CsvService {
    rawRepo;
    calcRepo;
    calculationService;
    constructor(rawRepo, calcRepo, calculationService) {
        this.rawRepo = rawRepo;
        this.calcRepo = calcRepo;
        this.calculationService = calculationService;
    }
    async importCsvFromEsp32(ip, filename) {
        const url = `http://${ip}/download?file=${filename}`;
        console.log('\n📌 Fetching CSV from ESP32:', url);
        let response;
        try {
            response = await axios_1.default.get(url, { responseType: 'text' });
            console.log('✅ RAW CSV RESPONSE LENGTH:', response.data.length);
            console.log('✅ RAW CSV PREVIEW:\n', response.data.slice(0, 500));
        }
        catch (err) {
            console.error('❌ ESP32 HTTP Error:', err.message);
            throw new Error('ESP32 not reachable or download failed.');
        }
        if (!response.data || response.data.length === 0) {
            throw new Error('❌ CSV file empty on ESP32.');
        }
        const rows = [];
        const stream = stream_1.Readable.from([response.data]);
        return new Promise((resolve, reject) => {
            stream
                .pipe((0, csv_parser_1.default)({ mapHeaders: ({ header }) => header.trim() }))
                .on('data', (row) => {
                rows.push(row);
            })
                .on('end', async () => {
                if (rows.length === 0) {
                    return reject(new Error('CSV parsed but no rows found — header mismatch?'));
                }
                try {
                    const formattedRows = rows.map((row) => ({
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
                    const groupedByPlayer = {};
                    for (const row of rawEntities) {
                        if (!groupedByPlayer[row.player_id]) {
                            groupedByPlayer[row.player_id] = [];
                        }
                        groupedByPlayer[row.player_id].push(row);
                    }
                    let playersProcessed = 0;
                    for (const playerId in groupedByPlayer) {
                        const playerRows = groupedByPlayer[playerId];
                        let calculated = this.calculationService.computeMetrics(playerRows);
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
                        const entity = this.calcRepo.create(calculated);
                        await this.calcRepo.save(entity);
                        playersProcessed++;
                    }
                    console.log('✅ CALCULATED data saved for', playersProcessed, 'players');
                    resolve({
                        message: 'CSV imported and calculated data generated successfully ✅',
                        rowsInserted: formattedRows.length,
                        playersCalculated: playersProcessed,
                        filename,
                    });
                }
                catch (err) {
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
};
exports.CsvService = CsvService;
exports.CsvService = CsvService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(raw_data_entity_1.RawData)),
    __param(1, (0, typeorm_1.InjectRepository)(calculated_data_entity_1.CalculatedData)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        calculation_service_1.CalculationService])
], CsvService);
//# sourceMappingURL=csv.service.js.map