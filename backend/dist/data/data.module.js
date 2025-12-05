"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const raw_data_entity_1 = require("./entities/raw-data.entity");
const calculated_data_entity_1 = require("./entities/calculated-data.entity");
const wifi_service_1 = require("./wifi.service");
const calculation_service_1 = require("./calculation.service");
const data_controller_1 = require("./data.controller");
const csv_service_1 = require("./csv.service");
let DataModule = class DataModule {
};
exports.DataModule = DataModule;
exports.DataModule = DataModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([raw_data_entity_1.RawData, calculated_data_entity_1.CalculatedData])],
        providers: [wifi_service_1.WifiService, csv_service_1.CsvService, calculation_service_1.CalculationService],
        controllers: [data_controller_1.DataController],
    })
], DataModule);
//# sourceMappingURL=data.module.js.map