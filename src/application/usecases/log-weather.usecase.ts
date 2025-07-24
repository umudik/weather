import { Injectable } from "@nestjs/common";
import { WeatherQueryRepositoryPort } from "src/domain/abstracts/repositories/weather-query.repository.abstract";
import { BaseClass } from "src/domain/common/base-class";
import { WeatherQuery } from "src/domain/entities/weather-query.entity";

export class LogWeatherUseCaseInput extends BaseClass {
    location: string;
    temperature: number;
    requestCount: number;
    service1Temp: number;
    service2Temp: number;
}

export class LogWeatherUseCaseOutput extends BaseClass {
}

@Injectable()
export class LogWeatherUseCase {
    constructor(
        private readonly repository: WeatherQueryRepositoryPort,
    ) {}

    async execute(
        input: LogWeatherUseCaseInput,
    ): Promise<LogWeatherUseCaseOutput> {
        await this.repository.create(WeatherQuery.create({
            location: input.location,
            service_1_temperature: input.service1Temp,
            service_2_temperature: input.service2Temp,
            request_count: input.requestCount,
        }));
        return LogWeatherUseCaseOutput.create({});
    }
}
