import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WeatherService } from "../../domain/abstracts/services/weather.service.abstract";
import {
    LocationNotFoundError,
    WeatherServiceError,
} from "../../domain/errors/service.error";

@Injectable()
export class WeatherApiService extends WeatherService {
    private readonly baseUrl = "http://api.weatherapi.com/v1/forecast.json";
    private readonly logger = new Logger(WeatherApiService.name);

    constructor(private configService: ConfigService) {
        super();
    }

    async getWeather(location: string): Promise<number> {
        const apiKey = this.configService.get<string>("weatherApiKey");
        const url = `${this.baseUrl}?key=${apiKey}&q=${
            encodeURIComponent(location)
        }&days=1&aqi=no&alerts=no`;
        this.logger.log("Openweather api staring to fetch", {
            location,
        });
        const response = await fetch(url);

        const data = await response.json();

        if (!response.ok) {
            if (data.error.code === 1006) {
                throw new LocationNotFoundError();
            }

            new WeatherServiceError(
                `WeatherAPI service error: ${response.status}`,
                location,
            );
        }

        return data.current.temp_c;
    }

    getName(): string {
        return "weatherapi";
    }
}
