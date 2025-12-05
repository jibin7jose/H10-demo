// --- src/data/calculation.service.ts (FINAL FIXES) ---

import { Injectable } from '@nestjs/common';
import { RawData } from './entities/raw-data.entity';
import { CalculatedData } from './entities/calculated-data.entity';

// Define common constants and thresholds
const EARTH_RADIUS_M = 6371000;
const G_ACCEL = 9.80665; // m/s²

// Thresholds based on your specifications (or common use)
const V_HSR_MS = 4.0; // 4.0 m/s (approx 14.4 km/h)
const V_SPRINT_MS = 7.0; // 7.0 m/s (approx 25.2 km/h)
const A_EVENT_TH = 3.0; // 3.0 m/s² for counting events
const T_MIN_ACCEL_S = 1.0; // Minimum duration for Accel/Decel event
// const A_PEAK_TH = 2.5; // 2.5 m/s² for Max Accel Count (Not used in final logic)
const HR_RED_ZONE_PERCENT = 0.9; // 90% of HRmax for Red Zone

// PlayerLoad Constants (PL is unitless, normalized by 100)
const PL_SCALE = 100; 

// Metabolic Power Constants (Simplified)
const C0 = 4.0; // J/kg/m
const C1 = 2.0; // Scaler

/**
 * Interface representing a processed data point.
 * This is used to correctly type the intermediate processedData array.
 */
interface ProcessedDataPoint {
    dt_k: number; // Time delta (seconds)
    d_k: number; // Distance delta (meters)
    v_k: number; // Instantaneous speed (m/s)
    a_k: number; // Instantaneous acceleration (m/s²)
    hr: number; // Heart rate
    pl_delta: number; // PlayerLoad delta
    metabolic_power_k: number; // Metabolic power (J/kg)
}

@Injectable()
export class CalculationService {

    // Helper function to calculate Haversine distance
    private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = EARTH_RADIUS_M;
        const φ1 = lat1 * (Math.PI / 180);
        const φ2 = lat2 * (Math.PI / 180);
        const Δφ = (lat2 - lat1) * (Math.PI / 180);
        const Δλ = (lon2 - lon1) * (Math.PI / 180);

        const a = Math.sin(Δφ / 2) ** 2 +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // distance in meters
    }

    // Helper function to calculate the magnitude of the change in accelerometer reading
    private calculatePlayerLoadDelta(a_x1: number, a_y1: number, a_z1: number, a_x2: number, a_y2: number, a_z2: number): number {
        // Use default value 0 if any value is null/undefined to prevent arithmetic errors
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

    computeMetrics(rawData: RawData[]): CalculatedData {
        const result = new CalculatedData();
        
        // Safely assign player_id
        const playerId = rawData?.length > 0 && rawData[0].player_id !== undefined ? rawData[0].player_id : 0;
        result.player_id = playerId;

        if (!rawData || rawData.length < 2) {
            return result; 
        }

        // -------------------------------------------------------------------
        // 1. PRE-PROCESSING: Calculate d_i, dt_i, v_i, a_i, PlayerLoad_delta_i
        // -------------------------------------------------------------------
        const processedData: ProcessedDataPoint[] = [];
        let totalTimeSeconds = 0;
        let cumulativePlayerLoad = 0;
        let cumulativeMetabolicPower = 0;
        let v_k_prev = 0;
        for (let k = 0; k < rawData.length - 1; k++) {
            const current = rawData[k];
            const next = rawData[k + 1];

            // 1.1 Calculate time difference (dt_i)
            
            // Check if timestamps are valid Date objects and get time in milliseconds
            const currentTimestamp = current.timestamp instanceof Date ? current.timestamp.getTime() : new Date(current.timestamp).getTime();
            const nextTimestamp = next.timestamp instanceof Date ? next.timestamp.getTime() : new Date(next.timestamp).getTime();
            
            // If either timestamp is invalid or results in NaN, skip
            if (isNaN(currentTimestamp) || isNaN(nextTimestamp)) continue;

            const dt_k = (nextTimestamp - currentTimestamp) / 1000;
            
            // CRITICAL: Prevent Division by Zero if two consecutive samples have the exact same timestamp
            if (dt_k <= 0) continue; 
            totalTimeSeconds += dt_k;

            // 1.2 Calculate Haversine distance (d_i)
            const d_k = this.haversine(current.latitude, current.longitude, next.latitude, next.longitude);

            // 1.3 Calculate instantaneous speed (v_i)
            const v_k = d_k / dt_k; // m/s

            // 1.4 Calculate instantaneous acceleration (a_i)
            const v_prev = k > 0 ? processedData[k - 1].v_k : 0;
            const a_k = (v_k - v_prev) / dt_k; // m/s²

            // 1.5 Calculate PlayerLoad delta (Δa_mag)
            // 🚨 FIX 2: Use current.x, current.y, current.z instead of a_x, a_y, a_z
            // This fixes errors 2339
            // 1.5 Calculate PlayerLoad delta (Δa_mag)
            const pl_delta = this.calculatePlayerLoadDelta(
                current.x ?? 0, current.y ?? 0, current.z ?? 0, // Ensure x, y, z are not null
                next.x ?? 0, next.y ?? 0, next.z ?? 0          // Ensure x, y, z are not null
            );
            cumulativePlayerLoad += pl_delta;
            
            // 1.6 Calculate Metabolic Power (P[k])
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
        
        // -------------------------------------------------------------------
        // 2. METRIC CALCULATION using processedData
        // -------------------------------------------------------------------
        
        // D1. Distance Metrics
        const totalDistance = processedData.reduce((sum, d) => sum + d.d_k, 0);
        const hsrDistance = processedData
            .filter(d => d.v_k > V_HSR_MS)
            .reduce((sum, d) => sum + d.d_k, 0);
        const sprintDistance = processedData
            .filter(d => d.v_k > V_SPRINT_MS)
            .reduce((sum, d) => sum + d.d_k, 0);
        
        // D2. Speed Metrics
        const topSpeed = processedData.reduce((max, d) => Math.max(max, d.v_k), 0); // m/s
        
        // D3. Count Sprints (Duration-based logic)
        let sprintCount = 0;
        let inSprint = false;
        let sprintRunTime = 0;

        for (const d of processedData) {
            if (d.v_k > V_SPRINT_MS) {
                sprintRunTime += d.dt_k;
                if (!inSprint) inSprint = true;
            } else if (inSprint) {
                if (sprintRunTime >= T_MIN_ACCEL_S) {
                    sprintCount++;
                }
                inSprint = false;
                sprintRunTime = 0;
            }
        }
        
        // D4. Acceleration/Deceleration Counts (Duration-based logic)
        let accelCount = 0;
        let decelCount = 0;
        let inAccel = false;
        let inDecel = false;
        let runTimeAccel = 0;
        let runTimeDecel = 0;

        for (const d of processedData) {
            // Acceleration check
            if (d.a_k > A_EVENT_TH) {
                runTimeAccel += d.dt_k;
                if (!inAccel) inAccel = true;
            } else if (inAccel) {
                if (runTimeAccel >= T_MIN_ACCEL_S) accelCount++;
                inAccel = false;
                runTimeAccel = 0;
            }
            // Deceleration check
            if (d.a_k < -A_EVENT_TH) {
                runTimeDecel += d.dt_k;
                if (!inDecel) inDecel = true;
            } else if (inDecel) {
                if (runTimeDecel >= T_MIN_ACCEL_S) decelCount++;
                inDecel = false;
                runTimeDecel = 0;
            }
        }
        
        // D5. Max Accel/Decel
        const maxAcceleration = processedData.reduce((max, d) => Math.max(max, d.a_k), 0);
        const maxDeceleration = processedData.reduce((min, d) => Math.min(min, d.a_k), 0);

        // D6. PlayerLoad
        const playerLoad = cumulativePlayerLoad / PL_SCALE; // Normalized by 100

        // D7. Power Score (Mean Metabolic Power)
        const powerScore = T_total > 0 ? (cumulativeMetabolicPower / T_total) : 0; // Mean Power in W/kg

        // D8. HR Metrics (Uses Raw Data for full history check)
        const hrValues = rawData.map(d => d.heartrate).filter(hr => hr > 0);
        const hrMax = hrValues.length > 0 ? Math.max(...hrValues) : 0;

        // Use Tanaka formula for HRmax estimation if no data is available
        const estimatedHrMax = hrMax > 0 ? hrMax : (208 - 0.7 * 25); // Assumes age 25 for example
        const hrRedZone = estimatedHrMax * HR_RED_ZONE_PERCENT;
        
        const timeInRedZoneSamples = hrValues.filter(hr => hr >= hrRedZone).length;
        const totalSamples = hrValues.length;

        const timeInRedZone = timeInRedZoneSamples; 
        const percentInRedZone = totalSamples > 0 ? (timeInRedZoneSamples / totalSamples) * 100 : 0;
        
        // D9. HR Recovery Time (Placeholder/Proxy)
        const hrRecoveryTime = totalSamples > 0 ? hrMax / 10 : 0; 

        // -------------------------------------------------------------------
        // 3. FINAL RESULT MAPPING
        // -------------------------------------------------------------------
        result.total_distance = parseFloat(totalDistance.toFixed(2));
        result.hsr_distance = parseFloat(hsrDistance.toFixed(2));
        result.sprint_distance = parseFloat(sprintDistance.toFixed(2));
        result.top_speed = parseFloat(topSpeed.toFixed(2)); // m/s
        result.sprint_count = sprintCount;
        result.accelerations = accelCount;
        result.decelerations = decelCount;
        result.max_acceleration = parseFloat(maxAcceleration.toFixed(2));
        result.max_deceleration = parseFloat(maxDeceleration.toFixed(2));
        result.player_load = parseFloat(playerLoad.toFixed(2));
        result.power_score = parseFloat(powerScore.toFixed(2)); // W/kg
        result.hr_max = hrMax;
        result.time_in_red_zone = timeInRedZone; // Proxy for time in seconds
        result.percent_in_red_zone = parseFloat(percentInRedZone.toFixed(2));
        result.hr_recovery_time = parseFloat(hrRecoveryTime.toFixed(2)); // Proxy value
        
        return result;
    }
}