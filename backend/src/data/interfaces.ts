// Define the expected structure for RawData based on usage in computeMetrics
// export interface RawData {
//     player_id: number;
//     timestamp: number; // Assuming Unix epoch in ms
//     latitude: number;
//     longitude: number;
//     heartrate: number;
    
//     // 🚨 FIX for errors about missing properties: Must be present for PlayerLoad
//     a_x: number; // Accelerometer X (m/s² or g)
//     a_y: number; // Accelerometer Y
//     a_z: number; // Accelerometer Z
// }

// 🚨 FIX for "Property 'v_k' does not exist on type 'never'."
// Define the structure of the data created during the processing loop
export interface ProcessedData {
    dt_k: number; // Time delta (seconds)
    d_k: number; // Distance delta (meters)
    v_k: number; // Instantaneous speed (m/s)
    a_k: number; // Instantaneous acceleration (m/s²)
    hr: number; // Heart rate
    pl_delta: number; // PlayerLoad delta
    metabolic_power_k: number; // Metabolic power (W/kg)
}