import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RawData } from './entities/raw-data.entity';
import { CalculatedData } from './entities/calculated-data.entity';
import { WifiService } from './wifi.service';
import { CalculationService } from './calculation.service';
import { DataController } from './data.controller';
import { CsvService } from './csv.service';

@Module({
  imports: [TypeOrmModule.forFeature([RawData, CalculatedData])],
  providers: [WifiService, CsvService, CalculationService],
  controllers: [DataController],
})
export class DataModule {}
