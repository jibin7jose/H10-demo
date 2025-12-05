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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WifiService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const raw_data_entity_1 = require("./entities/raw-data.entity");
const calculated_data_entity_1 = require("./entities/calculated-data.entity");
const calculation_service_1 = require("./calculation.service");
let WifiService = class WifiService {
    rawRepo;
    calcRepo;
    calculationService;
    constructor(rawRepo, calcRepo, calculationService) {
        this.rawRepo = rawRepo;
        this.calcRepo = calcRepo;
        this.calculationService = calculationService;
    }
    async receiveDataFromESP32(data) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            throw new common_1.BadRequestException('Invalid data received from ESP32');
        }
        try {
            console.log(`📡 Data received from ESP32: ${data.length} rows`);
            const formatted = data.map((row) => ({
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
                timestamp: row.timestamp
                    ? new Date(Number(row.timestamp) * 1000)
                    : new Date(),
            }));
            const rawEntities = this.rawRepo.create(formatted);
            const savedRaw = await this.rawRepo.save(rawEntities);
            console.log('✅ Raw data saved:', savedRaw.length);
            let calculated = this.calculationService.computeMetrics(savedRaw);
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
            const savedCalculated = await this.calcRepo.save(calculated);
            console.log('✅ Calculated data saved');
            return {
                message: 'Data received & processed successfully ✅',
                rowsInserted: savedRaw.length,
                calculated: savedCalculated,
            };
        }
        catch (err) {
            console.error('❌ WifiService error:', err);
            throw new common_1.BadRequestException(err.message);
        }
    }
};
exports.WifiService = WifiService;
exports.WifiService = WifiService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(raw_data_entity_1.RawData)),
    __param(1, (0, typeorm_1.InjectRepository)(calculated_data_entity_1.CalculatedData)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        calculation_service_1.CalculationService])
], WifiService);
//# sourceMappingURL=wifi.service.js.map