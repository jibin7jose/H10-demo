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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculatedData = void 0;
const typeorm_1 = require("typeorm");
let CalculatedData = class CalculatedData {
    id;
    player_id;
    total_distance;
    hsr_distance;
    sprint_distance;
    top_speed;
    sprint_count;
    accelerations;
    decelerations;
    max_acceleration;
    max_deceleration;
    player_load;
    power_score;
    hr_max;
    time_in_red_zone;
    percent_in_red_zone;
    hr_recovery_time;
    created_at;
};
exports.CalculatedData = CalculatedData;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CalculatedData.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CalculatedData.prototype, "player_id", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], CalculatedData.prototype, "total_distance", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], CalculatedData.prototype, "hsr_distance", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], CalculatedData.prototype, "sprint_distance", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], CalculatedData.prototype, "top_speed", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], CalculatedData.prototype, "sprint_count", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], CalculatedData.prototype, "accelerations", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], CalculatedData.prototype, "decelerations", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], CalculatedData.prototype, "max_acceleration", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], CalculatedData.prototype, "max_deceleration", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], CalculatedData.prototype, "player_load", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], CalculatedData.prototype, "power_score", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], CalculatedData.prototype, "hr_max", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], CalculatedData.prototype, "time_in_red_zone", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], CalculatedData.prototype, "percent_in_red_zone", void 0);
__decorate([
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], CalculatedData.prototype, "hr_recovery_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], CalculatedData.prototype, "created_at", void 0);
exports.CalculatedData = CalculatedData = __decorate([
    (0, typeorm_1.Entity)()
], CalculatedData);
//# sourceMappingURL=calculated-data.entity.js.map