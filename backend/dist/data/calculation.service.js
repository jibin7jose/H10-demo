"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculationService = void 0;
const common_1 = require("@nestjs/common");
const calculated_data_entity_1 = require("./entities/calculated-data.entity");
const EARTH_RADIUS_M = 6371000;
const G_ACCEL = 9.80665;
const V_HSR_MS = 4.0;
const V_SPRINT_MS = 7.0;
const A_EVENT_TH = 3.0;
const T_MIN_ACCEL_S = 1.0;
const HR_RED_ZONE_PERCENT = 0.9;
const PL_SCALE = 100;
const C0 = 4.0;
const C1 = 2.0;
let CalculationService = class CalculationService {
    haversine(lat1, lon1, lat2, lon2) {
        const R = EARTH_RADIUS_M;
        const φ1 = lat1 * (Math.PI / 180);
        const φ2 = lat2 * (Math.PI / 180);
        const Δφ = (lat2 - lat1) * (Math.PI / 180);
        const Δλ = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    calculatePlayerLoadDelta(a_x1, a_y1, a_z1, a_x2, a_y2, a_z2) {
        const ax1 = a_x1 ?? 0;
        const ay1 = a_y1 ?? 0;
        const az1 = a_z1 ?? 0;
        const ax2 = a_x2 ?? 0;
        const ay2 = a_y2 ?? 0;
        const az2 = a_z2 ?? 0;
        const Δax = ax2 - ax1;
        const Δay = ay2 - ay1;
        const Δaz = az2 - az1;
        return Math.sqrt(Δax ** 2 + Δay ** 2 + Δaz ** 2);
    }
    computeMetrics(rawData) {
        const result = new calculated_data_entity_1.CalculatedData();
        const playerId = rawData?.length > 0 && rawData[0].player_id !== undefined ? rawData[0].player_id : 0;
        result.player_id = playerId;
        if (!rawData || rawData.length < 2) {
            return result;
        }
        const processedData = [];
        let totalTimeSeconds = 0;
        let cumulativePlayerLoad = 0;
        let cumulativeMetabolicPower = 0;
        let v_k_prev = 0;
        for (let k = 0; k < rawData.length - 1; k++) {
            const current = rawData[k];
            const next = rawData[k + 1];
            const currentTimestamp = current.timestamp instanceof Date ? current.timestamp.getTime() : new Date(current.timestamp).getTime();
            const nextTimestamp = next.timestamp instanceof Date ? next.timestamp.getTime() : new Date(next.timestamp).getTime();
            if (isNaN(currentTimestamp) || isNaN(nextTimestamp))
                continue;
            const dt_k = (nextTimestamp - currentTimestamp) / 1000;
            if (dt_k <= 0)
                continue;
            totalTimeSeconds += dt_k;
            const d_k = this.haversine(current.latitude, current.longitude, next.latitude, next.longitude);
            const v_k = d_k / dt_k;
            const v_prev = k > 0 ? processedData[k - 1].v_k : 0;
            const a_k = (v_k - v_prev) / dt_k;
            const pl_delta = this.calculatePlayerLoadDelta(current.x ?? 0, current.y ?? 0, current.z ?? 0, next.x ?? 0, next.y ?? 0, next.z ?? 0);
            cumulativePlayerLoad += pl_delta;
            const metabolic_power_k = v_k * (C0 + C1 * (a_k / G_ACCEL));
            cumulativeMetabolicPower += metabolic_power_k * dt_k;
            processedData.push({
                dt_k, d_k, v_k, a_k,
                hr: current.heartrate,
                pl_delta,
                metabolic_power_k
            });
            v_k_prev = v_k;
        }
        const T_total = totalTimeSeconds;
        const totalDistance = processedData.reduce((sum, d) => sum + d.d_k, 0);
        const hsrDistance = processedData
            .filter(d => d.v_k > V_HSR_MS)
            .reduce((sum, d) => sum + d.d_k, 0);
        const sprintDistance = processedData
            .filter(d => d.v_k > V_SPRINT_MS)
            .reduce((sum, d) => sum + d.d_k, 0);
        const topSpeed = processedData.reduce((max, d) => Math.max(max, d.v_k), 0);
        let sprintCount = 0;
        let inSprint = false;
        let sprintRunTime = 0;
        for (const d of processedData) {
            if (d.v_k > V_SPRINT_MS) {
                sprintRunTime += d.dt_k;
                if (!inSprint)
                    inSprint = true;
            }
            else if (inSprint) {
                if (sprintRunTime >= T_MIN_ACCEL_S) {
                    sprintCount++;
                }
                inSprint = false;
                sprintRunTime = 0;
            }
        }
        let accelCount = 0;
        let decelCount = 0;
        let inAccel = false;
        let inDecel = false;
        let runTimeAccel = 0;
        let runTimeDecel = 0;
        for (const d of processedData) {
            if (d.a_k > A_EVENT_TH) {
                runTimeAccel += d.dt_k;
                if (!inAccel)
                    inAccel = true;
            }
            else if (inAccel) {
                if (runTimeAccel >= T_MIN_ACCEL_S)
                    accelCount++;
                inAccel = false;
                runTimeAccel = 0;
            }
            if (d.a_k < -A_EVENT_TH) {
                runTimeDecel += d.dt_k;
                if (!inDecel)
                    inDecel = true;
            }
            else if (inDecel) {
                if (runTimeDecel >= T_MIN_ACCEL_S)
                    decelCount++;
                inDecel = false;
                runTimeDecel = 0;
            }
        }
        const maxAcceleration = processedData.reduce((max, d) => Math.max(max, d.a_k), 0);
        const maxDeceleration = processedData.reduce((min, d) => Math.min(min, d.a_k), 0);
        const playerLoad = cumulativePlayerLoad / PL_SCALE;
        const powerScore = T_total > 0 ? (cumulativeMetabolicPower / T_total) : 0;
        const hrValues = rawData.map(d => d.heartrate).filter(hr => hr > 0);
        const hrMax = hrValues.length > 0 ? Math.max(...hrValues) : 0;
        const estimatedHrMax = hrMax > 0 ? hrMax : (208 - 0.7 * 25);
        const hrRedZone = estimatedHrMax * HR_RED_ZONE_PERCENT;
        const timeInRedZoneSamples = hrValues.filter(hr => hr >= hrRedZone).length;
        const totalSamples = hrValues.length;
        const timeInRedZone = timeInRedZoneSamples;
        const percentInRedZone = totalSamples > 0 ? (timeInRedZoneSamples / totalSamples) * 100 : 0;
        const hrRecoveryTime = totalSamples > 0 ? hrMax / 10 : 0;
        result.total_distance = parseFloat(totalDistance.toFixed(2));
        result.hsr_distance = parseFloat(hsrDistance.toFixed(2));
        result.sprint_distance = parseFloat(sprintDistance.toFixed(2));
        result.top_speed = parseFloat(topSpeed.toFixed(2));
        result.sprint_count = sprintCount;
        result.accelerations = accelCount;
        result.decelerations = decelCount;
        result.max_acceleration = parseFloat(maxAcceleration.toFixed(2));
        result.max_deceleration = parseFloat(maxDeceleration.toFixed(2));
        result.player_load = parseFloat(playerLoad.toFixed(2));
        result.power_score = parseFloat(powerScore.toFixed(2));
        result.hr_max = hrMax;
        result.time_in_red_zone = timeInRedZone;
        result.percent_in_red_zone = parseFloat(percentInRedZone.toFixed(2));
        result.hr_recovery_time = parseFloat(hrRecoveryTime.toFixed(2));
        return result;
    }
};
exports.CalculationService = CalculationService;
exports.CalculationService = CalculationService = __decorate([
    (0, common_1.Injectable)()
], CalculationService);
//# sourceMappingURL=calculation.service.js.map