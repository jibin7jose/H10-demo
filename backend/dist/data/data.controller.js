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
exports.DataController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wifi_service_1 = require("./wifi.service");
const csv_service_1 = require("./csv.service");
const calculated_data_entity_1 = require("./entities/calculated-data.entity");
let DataController = class DataController {
    wifiService;
    csvService;
    calcRepo;
    constructor(wifiService, csvService, calcRepo) {
        this.wifiService = wifiService;
        this.csvService = csvService;
        this.calcRepo = calcRepo;
    }
    async uploadFromESP(body) {
        return this.wifiService.receiveDataFromESP32(body);
    }
    async importCsv(ip, filename) {
        if (!ip || !filename) {
            throw new common_1.BadRequestException('ip and file are required');
        }
        return this.csvService.importCsvFromEsp32(ip, filename);
    }
    async getAllPlayers() {
        const uniquePlayers = await this.calcRepo
            .createQueryBuilder('calculated_data')
            .select('calculated_data.player_id', 'player_id')
            .distinct(true)
            .orderBy('player_id', 'ASC')
            .getRawMany();
        return uniquePlayers.map((p) => ({
            player_id: Number(p.player_id),
        }));
    }
    async getMatchDatesByPlayer(playerId) {
        if (!playerId || isNaN(Number(playerId))) {
            throw new common_1.BadRequestException('A valid "playerId" is required.');
        }
        const uniqueDates = await this.calcRepo
            .createQueryBuilder('calculated_data')
            .select("DATE_TRUNC('day', calculated_data.created_at)::date::text", 'match_day')
            .distinct(true)
            .where('calculated_data.player_id = :playerId', {
            playerId: Number(playerId),
        })
            .orderBy('match_day', 'DESC')
            .getRawMany();
        return uniqueDates.map((d) => d.match_day);
    }
    async getCalculatedData(created_at, playerIdsString) {
        if (!created_at || !playerIdsString) {
            return this.calcRepo.find({
                order: { created_at: 'DESC' },
            });
        }
        const matchDate = new Date(created_at);
        if (isNaN(matchDate.getTime())) {
            throw new common_1.BadRequestException('Invalid date format');
        }
        const playerIds = playerIdsString
            .split(',')
            .map((id) => Number(id))
            .filter((id) => !isNaN(id));
        if (playerIds.length === 0) {
            return [];
        }
        const startOfDay = new Date(matchDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(matchDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        return this.calcRepo
            .createQueryBuilder('calculated_data')
            .where('calculated_data.created_at >= :start', {
            start: startOfDay,
        })
            .andWhere('calculated_data.created_at <= :end', {
            end: endOfDay,
        })
            .andWhere('calculated_data.player_id IN (:...playerIds)', { playerIds })
            .orderBy('calculated_data.player_id', 'ASC')
            .getMany();
    }
    async getMatchDates() {
        const uniqueDates = await this.calcRepo
            .createQueryBuilder('calculated_data')
            .select("DATE_TRUNC('day', calculated_data.created_at)::date::text", 'match_day')
            .distinct(true)
            .orderBy('match_day', 'DESC')
            .getRawMany();
        return uniqueDates.map((d) => d.match_day);
    }
    async getPlayersByMatch(created_at) {
        if (!created_at) {
            throw new common_1.BadRequestException('The "created_at" query parameter is required.');
        }
        const matchDate = new Date(created_at);
        if (isNaN(matchDate.getTime())) {
            throw new common_1.BadRequestException('Invalid date format for "created_at".');
        }
        const startOfDay = new Date(matchDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(matchDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        const players = await this.calcRepo
            .createQueryBuilder('calculated_data')
            .select('calculated_data.player_id', 'player_id')
            .distinct(true)
            .where('calculated_data.created_at >= :start', {
            start: startOfDay,
        })
            .andWhere('calculated_data.created_at <= :end', {
            end: endOfDay,
        })
            .orderBy('player_id', 'ASC')
            .getRawMany();
        return players.map((p) => ({
            player_id: Number(p.player_id),
        }));
    }
    async getPlayerMetrics(created_at, playerId) {
        if (!created_at || !playerId) {
            throw new common_1.BadRequestException('Both created_at and playerId are required.');
        }
        const matchDate = new Date(created_at);
        if (isNaN(matchDate.getTime())) {
            throw new common_1.BadRequestException('Invalid date format');
        }
        const player = Number(playerId);
        const startOfDay = new Date(matchDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(matchDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        return this.calcRepo
            .createQueryBuilder('calculated_data')
            .where('calculated_data.created_at >= :start', {
            start: startOfDay,
        })
            .andWhere('calculated_data.created_at <= :end', {
            end: endOfDay,
        })
            .andWhere('calculated_data.player_id = :playerId', {
            playerId: player,
        })
            .getMany();
    }
    async getPlayerHistory(playerId, dates) {
        if (!playerId || isNaN(Number(playerId))) {
            throw new common_1.BadRequestException('A valid "playerId" is required.');
        }
        if (!dates) {
            throw new common_1.BadRequestException('The "dates" parameter is required.');
        }
        const player = Number(playerId);
        const dateList = dates.split(',');
        const dateFilters = dateList
            .map((dateStr) => {
            const matchDate = new Date(dateStr);
            if (isNaN(matchDate.getTime()))
                return null;
            const start = new Date(matchDate);
            start.setUTCHours(0, 0, 0, 0);
            const end = new Date(matchDate);
            end.setUTCHours(23, 59, 59, 999);
            return { start, end };
        })
            .filter(Boolean);
        if (dateFilters.length === 0) {
            return [];
        }
        const dateWhereClauses = dateFilters
            .map((_, index) => `(calculated_data.created_at >= :start${index} AND calculated_data.created_at <= :end${index})`)
            .join(' OR ');
        const dateParams = dateFilters.reduce((acc, filter, index) => {
            acc[`start${index}`] = filter.start;
            acc[`end${index}`] = filter.end;
            return acc;
        }, {});
        return this.calcRepo
            .createQueryBuilder('calculated_data')
            .where('calculated_data.player_id = :playerId', {
            playerId: player,
        })
            .andWhere(`(${dateWhereClauses})`, dateParams)
            .orderBy('created_at', 'DESC')
            .getMany();
    }
};
exports.DataController = DataController;
__decorate([
    (0, common_1.Post)('upload'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataController.prototype, "uploadFromESP", null);
__decorate([
    (0, common_1.Get)('import-csv'),
    __param(0, (0, common_1.Query)('ip')),
    __param(1, (0, common_1.Query)('file')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DataController.prototype, "importCsv", null);
__decorate([
    (0, common_1.Get)('players'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataController.prototype, "getAllPlayers", null);
__decorate([
    (0, common_1.Get)('player-match-dates'),
    __param(0, (0, common_1.Query)('playerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DataController.prototype, "getMatchDatesByPlayer", null);
__decorate([
    (0, common_1.Get)('calculated'),
    __param(0, (0, common_1.Query)('created_at')),
    __param(1, (0, common_1.Query)('playerIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DataController.prototype, "getCalculatedData", null);
__decorate([
    (0, common_1.Get)('match-dates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataController.prototype, "getMatchDates", null);
__decorate([
    (0, common_1.Get)('match-players'),
    __param(0, (0, common_1.Query)('created_at')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DataController.prototype, "getPlayersByMatch", null);
__decorate([
    (0, common_1.Get)('player-metrics'),
    __param(0, (0, common_1.Query)('created_at')),
    __param(1, (0, common_1.Query)('playerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DataController.prototype, "getPlayerMetrics", null);
__decorate([
    (0, common_1.Get)('player-history'),
    __param(0, (0, common_1.Query)('playerId')),
    __param(1, (0, common_1.Query)('dates')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DataController.prototype, "getPlayerHistory", null);
exports.DataController = DataController = __decorate([
    (0, common_1.Controller)('data'),
    __param(2, (0, typeorm_1.InjectRepository)(calculated_data_entity_1.CalculatedData)),
    __metadata("design:paramtypes", [wifi_service_1.WifiService,
        csv_service_1.CsvService,
        typeorm_2.Repository])
], DataController);
//# sourceMappingURL=data.controller.js.map