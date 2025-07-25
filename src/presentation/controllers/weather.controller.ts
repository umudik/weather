import { Controller, Get, Logger, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { WeatherResponseDto } from "../dtos/weather-response.dto";
import { WeatherRequestDto } from "../dtos/weather-request.dto";
import { GetWeatherUseCase } from "../../application/usecases/get-weather.usecase";
import {
    BatchCompletedEvent,
    BatchManagementService,
} from "../../domain/services/batch-management.service";
import { UpdateWeatherRequestCountUseCase } from "../../application/usecases/update-weather-request-count.usecase";

@ApiTags("weather")
@Controller()
export class WeatherController {
    private readonly logger = new Logger(WeatherController.name);
    constructor(
        private readonly getWeatherUseCase: GetWeatherUseCase,
        private readonly batchManagementService: BatchManagementService,
        private readonly updateWeatherRequestCountUseCase:
            UpdateWeatherRequestCountUseCase,
    ) {
        this.batchManagementService.setBatchCompletedCallback(
            async (event: BatchCompletedEvent) => {
                try {
                    await this.updateWeatherRequestCountUseCase.execute({
                        logId: event.logId!,
                        requestCount: event.requestCount,
                    });
                } catch (error) {
                    this.logger.error(
                        `Failed to update request count: ${error.message}`,
                    );
                }
            },
        );
    }

    @Get("weather")
    async getWeather(
        @Query() query: WeatherRequestDto,
    ): Promise<WeatherResponseDto> {
        const location = query.q;
        const normalizedLocation = location.trim();
        const now = Date.now();

        const response = await this.batchManagementService.batchExecute(
            normalizedLocation,
            now,
            5000,
            10,
            () => this.getWeatherUseCase.execute({ location: location }),
        );

        return WeatherResponseDto.create({
            location: location,
            temperature: response.temperature,
        });
    }
}
