// --- src/data/data.controller.ts (FINAL FIXED VERSION) ---

import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WifiService } from './wifi.service';
import { CsvService } from './csv.service';
import { CalculatedData } from './entities/calculated-data.entity';

@Controller('data')
export class DataController {
  constructor(
    private readonly wifiService: WifiService,
    private readonly csvService: CsvService,

    @InjectRepository(CalculatedData)
    private readonly calcRepo: Repository<CalculatedData>,
  ) {}

  // =================== POST /data/upload ===================
  @Post('upload')
  async uploadFromESP(@Body() body: any) {
    return this.wifiService.receiveDataFromESP32(body);
  }

  // =================== GET /data/import-csv ===================
  @Get('import-csv')
  async importCsv(
    @Query('ip') ip: string,
    @Query('file') filename: string,
  ) {
    if (!ip || !filename) {
      throw new BadRequestException('ip and file are required');
    }

    return this.csvService.importCsvFromEsp32(ip, filename);
  }

  // =================== GET /data/players ===================
  @Get('players')
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

  // =================== GET /data/player-match-dates ===================
  @Get('player-match-dates')
  async getMatchDatesByPlayer(
    @Query('playerId') playerId: string,
  ) {
    if (!playerId || isNaN(Number(playerId))) {
      throw new BadRequestException('A valid "playerId" is required.');
    }

    const uniqueDates = await this.calcRepo
      .createQueryBuilder('calculated_data')
      .select(
        "DATE_TRUNC('day', calculated_data.created_at)::date::text",
        'match_day',
      )
      .distinct(true)
      .where('calculated_data.player_id = :playerId', {
        playerId: Number(playerId),
      })
      .orderBy('match_day', 'DESC')
      .getRawMany();

    return uniqueDates.map((d) => d.match_day);
  }

  // =================== GET /data/calculated ===================
  @Get('calculated')
  async getCalculatedData(
    @Query('created_at') created_at: string,
    @Query('playerIds') playerIdsString: string,
  ) {
    // If no params → return everything
    if (!created_at || !playerIdsString) {
      return this.calcRepo.find({
        order: { created_at: 'DESC' },
      });
    }

    const matchDate = new Date(created_at);
    if (isNaN(matchDate.getTime())) {
      throw new BadRequestException('Invalid date format');
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
      .andWhere(
        'calculated_data.player_id IN (:...playerIds)',
        { playerIds },
      )
      .orderBy('calculated_data.player_id', 'ASC')
      .getMany();
  }

  // =================== GET /data/match-dates ===================
  @Get('match-dates')
  async getMatchDates() {
    const uniqueDates = await this.calcRepo
      .createQueryBuilder('calculated_data')
      .select(
        "DATE_TRUNC('day', calculated_data.created_at)::date::text",
        'match_day',
      )
      .distinct(true)
      .orderBy('match_day', 'DESC')
      .getRawMany();

    return uniqueDates.map((d) => d.match_day);
  }

  // =================== GET /data/match-players ===================
  @Get('match-players')
  async getPlayersByMatch(
    @Query('created_at') created_at: string,
  ) {
    if (!created_at) {
      throw new BadRequestException(
        'The "created_at" query parameter is required.',
      );
    }

    const matchDate = new Date(created_at);
    if (isNaN(matchDate.getTime())) {
      throw new BadRequestException(
        'Invalid date format for "created_at".',
      );
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

  // =================== GET /data/player-metrics ===================
  @Get('player-metrics')
  async getPlayerMetrics(
    @Query('created_at') created_at: string,
    @Query('playerId') playerId: string,
  ) {
    if (!created_at || !playerId) {
      throw new BadRequestException(
        'Both created_at and playerId are required.',
      );
    }

    const matchDate = new Date(created_at);
    if (isNaN(matchDate.getTime())) {
      throw new BadRequestException('Invalid date format');
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

  // =================== GET /data/player-history ===================
  @Get('player-history')
  async getPlayerHistory(
    @Query('playerId') playerId: string,
    @Query('dates') dates: string,
  ) {
    if (!playerId || isNaN(Number(playerId))) {
      throw new BadRequestException(
        'A valid "playerId" is required.',
      );
    }

    if (!dates) {
      throw new BadRequestException(
        'The "dates" parameter is required.',
      );
    }

    const player = Number(playerId);

    const dateList = dates.split(',');

    const dateFilters = dateList
      .map((dateStr) => {
        const matchDate = new Date(dateStr);
        if (isNaN(matchDate.getTime())) return null;

        const start = new Date(matchDate);
        start.setUTCHours(0, 0, 0, 0);

        const end = new Date(matchDate);
        end.setUTCHours(23, 59, 59, 999);

        return { start, end };
      })
      .filter(Boolean) as { start: Date; end: Date }[];

    if (dateFilters.length === 0) {
      return [];
    }

    const dateWhereClauses = dateFilters
      .map(
        (_, index) =>
          `(calculated_data.created_at >= :start${index} AND calculated_data.created_at <= :end${index})`,
      )
      .join(' OR ');

    const dateParams = dateFilters.reduce(
      (acc, filter, index) => {
        acc[`start${index}`] = filter.start;
        acc[`end${index}`] = filter.end;
        return acc;
      },
      {} as Record<string, Date>,
    );

    return this.calcRepo
      .createQueryBuilder('calculated_data')
      .where('calculated_data.player_id = :playerId', {
        playerId: player,
      })
      .andWhere(`(${dateWhereClauses})`, dateParams)
      .orderBy('created_at', 'DESC')
      .getMany();
  }
}
