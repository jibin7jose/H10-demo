import { Repository } from 'typeorm';
import { RawData } from './entities/raw-data.entity';
import { CalculatedData } from './entities/calculated-data.entity';
import { CalculationService } from './calculation.service';
export declare class CsvService {
    private rawRepo;
    private calcRepo;
    private readonly calculationService;
    constructor(rawRepo: Repository<RawData>, calcRepo: Repository<CalculatedData>, calculationService: CalculationService);
    importCsvFromEsp32(ip: string, filename: string): Promise<unknown>;
}
