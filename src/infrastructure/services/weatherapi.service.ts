import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WeatherService } from "../../domain/abstracts/services/weather.service.abstract";
import {
    LocationNotFoundError,
    WeatherServiceError,
} from "../../domain/errors/service.error";

@Injectable()
export class WeatherstackService extends WeatherService {
    private readonly baseUrl = "http://api.weatherstack.com/current";
    private readonly logger = new Logger(WeatherstackService.name);

    constructor(private configService: ConfigService) {
        super();
    }

    async getWeather(location: string): Promise<number> {
        const apiKey = this.configService.get<string>("weatherstackApiKey");
        const url = `${this.baseUrl}?access_key=${apiKey}&query=${
            encodeURIComponent(location)
        }`;
        this.logger.log("Weatherstack api staring to fetch", {
            location,
        });

        const response = await fetch(url);

        if (response.status === 400) {
            throw new LocationNotFoundError();
        }

        const data = await response.json();

        if (data.error) {
            if (
                data.error.code === 615
            ) {
                throw new LocationNotFoundError();
            }
            throw new WeatherServiceError(
                `Weatherstack API error: ${data.error.info}`,
                location,
            );
        }

        return data.current.temperature;
    }

    getName(): string {
        return "weatherstack";
    }
}
