"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const express_1 = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.use((0, express_1.json)({ limit: '30mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '30mb' }));
    await app.listen(3000);
    console.log('Server listening on http://172.30.81.150:3000');
}
bootstrap();
//# sourceMappingURL=main.js.map