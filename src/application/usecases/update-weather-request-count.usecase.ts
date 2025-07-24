import { Injectable } from "@nestjs/common";
import { WeatherQueryRepositoryPort } from "../../domain/abstracts/repositories/weather-query.repository.abstract";
import { BaseClass } from "../../domain/common/base-class";

export class UpdateWeatherRequestCountUseCaseInput extends BaseClass {
    logId: string;
    requestCount: number;
}

export class UpdateWeatherRequestCountUseCaseOutput extends BaseClass {
}

@Injectable()
export class UpdateWeatherRequestCountUseCase {
    constructor(
        private readonly repository: WeatherQueryRepositoryPort,
    ) {}

    async execute(
        input: UpdateWeatherRequestCountUseCaseInput,
    ): Promise<UpdateWeatherRequestCountUseCaseOutput> {
        await this.repository.updateRequestCount(
            input.logId,
            input.requestCount,
        );
        return UpdateWeatherRequestCountUseCaseOutput.create({});
    }
}
