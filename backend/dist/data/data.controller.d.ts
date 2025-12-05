import { Repository } from 'typeorm';
import { WifiService } from './wifi.service';
import { CsvService } from './csv.service';
import { CalculatedData } from './entities/calculated-data.entity';
export declare class DataController {
    private readonly wifiService;
    private readonly csvService;
    private readonly calcRepo;
    constructor(wifiService: WifiService, csvService: CsvService, calcRepo: Repository<CalculatedData>);
    uploadFromESP(body: any): Promise<{
        message: string;
        rowsInserted: number;
        calculated: CalculatedData;
    }>;
    importCsv(ip: string, filename: string): Promise<unknown>;
    getAllPlayers(): Promise<{
        player_id: number;
    }[]>;
    getMatchDatesByPlayer(playerId: string): Promise<any[]>;
    getCalculatedData(created_at: string, playerIdsString: string): Promise<CalculatedData[]>;
    getMatchDates(): Promise<any[]>;
    getPlayersByMatch(created_at: string): Promise<{
        player_id: number;
    }[]>;
    getPlayerMetrics(created_at: string, playerId: string): Promise<CalculatedData[]>;
    getPlayerHistory(playerId: string, dates: string): Promise<CalculatedData[]>;
}
