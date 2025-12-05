import { Repository } from 'typeorm';
import { RawData } from './entities/raw-data.entity';
import { CalculatedData } from './entities/calculated-data.entity';
import { CalculationService } from './calculation.service';
export declare class WifiService {
    private readonly rawRepo;
    private readonly calcRepo;
    private readonly calculationService;
    constructor(rawRepo: Repository<RawData>, calcRepo: Repository<CalculatedData>, calculationService: CalculationService);
    receiveDataFromESP32(data: any): Promise<{
        message: string;
        rowsInserted: number;
        calculated: CalculatedData;
    }>;
}
