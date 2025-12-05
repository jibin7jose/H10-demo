import { RawData } from './entities/raw-data.entity';
import { CalculatedData } from './entities/calculated-data.entity';
export declare class CalculationService {
    private haversine;
    private calculatePlayerLoadDelta;
    computeMetrics(rawData: RawData[]): CalculatedData;
}
