import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { WeatherResponseDto } from "../dtos/weather-response.dto";
import { WeatherRequestDto } from "../dtos/weather-request.dto";
import { GetWeatherUseCase } from "../../application/usecases/get-weather.usecase";
import { BatchManagementService } from "../../domain/services/batch-management.service";

@ApiTags("weather")
@Controller()
export class WeatherController {
    constructor(
        private readonly getWeatherUseCase: GetWeatherUseCase,
        private readonly batchManagementService: BatchManagementService,
    ) {
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
