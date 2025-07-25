import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GetWeatherUseCase } from "../application/usecases/get-weather.usecase";
import { UpdateWeatherRequestCountUseCase } from "../application/usecases/update-weather-request-count.usecase";
import { WeatherApiService } from "../infrastructure/services/openweather.service";
import { WeatherstackService } from "../infrastructure/services/weatherapi.service";
import { WeatherController } from "src/presentation/controllers/weather.controller";
import { WeatherQuery } from "src/domain/entities/weather-query.entity";
import { WeatherQueryRepository } from "src/infrastructure/repositories/weather-query.repository";
import { BatchManagementService } from "../domain/services/batch-management.service";
import { RedisCacheService } from "../infrastructure/services/redis-cache.service";
import { CacheService } from "../domain/abstracts/services/cache.service.abstract";
import { WeatherQueryRepositoryPort } from "../domain/abstracts/repositories/weather-query.repository.abstract";

@Module({
    imports: [TypeOrmModule.forFeature([WeatherQuery])],
    controllers: [WeatherController],
    providers: [
        GetWeatherUseCase,
        UpdateWeatherRequestCountUseCase,
        WeatherApiService,
        WeatherstackService,
        WeatherQueryRepository,
        BatchManagementService,
        RedisCacheService,
        {
            provide: CacheService,
            useClass: RedisCacheService,
        },
        {
            provide: WeatherQueryRepositoryPort,
            useClass: WeatherQueryRepository,
        },
    ],
    exports: [BatchManagementService],
})
export class WeatherModule {}
