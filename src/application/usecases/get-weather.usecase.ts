import { Injectable } from "@nestjs/common";
import { WeatherApiService } from "../../infrastructure/services/openweather.service";
import { WeatherstackService } from "../../infrastructure/services/weatherapi.service";
import {
    LocationNotFoundError,
    WeatherServiceError,
} from "../../domain/errors/service.error";
import { WeatherQueryRepositoryPort } from "../../domain/abstracts/repositories/weather-query.repository.abstract";
import { WeatherQuery } from "../../domain/entities/weather-query.entity";

export interface GetWeatherUseCaseInput {
    location: string;
}

export interface GetWeatherUseCaseOutput {
    location: string;
    temperature: number;
    logId: string;
}

@Injectable()
export class GetWeatherUseCase {
    constructor(
        private readonly weatherApiService: WeatherApiService,
        private readonly weatherstackService: WeatherstackService,
        private readonly weatherQueryRepository: WeatherQueryRepositoryPort,
    ) {}

    async execute(
        input: GetWeatherUseCaseInput,
    ): Promise<GetWeatherUseCaseOutput> {
        const { location } = input;

        const results = await Promise.allSettled([
            this.weatherApiService.getWeather(location),
            this.weatherstackService.getWeather(location),
        ]);

        const locationNotFoundErrors = results
            .filter((result) => result.status === "rejected")
            .map((result) => result.reason)
            .filter((error) => error instanceof LocationNotFoundError);

        if (locationNotFoundErrors.length > 0) {
            throw new LocationNotFoundError();
        }

        const successfulResults = results
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value);

        if (successfulResults.length === 0) {
            throw new WeatherServiceError(
                "All weather services are unavailable",
                location,
            );
        }

        const temperature = successfulResults.reduce(
            (sum, temp) => sum + temp,
            0,
        ) / successfulResults.length;

        const weatherQuery = WeatherQuery.create({
            location,
            service_1_temperature: successfulResults[0] || 0,
            service_2_temperature: successfulResults[1] || 0,
            request_count: 0,
        });

        await this.weatherQueryRepository.create(weatherQuery);

        return {
            location,
            temperature,
            logId: weatherQuery.id,
        };
    }
}
