import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { WeatherFetchedEvent } from "../../domain/events/weather-fetched.event";
import { WeatherQueryRepositoryPort } from "../../domain/abstracts/repositories/weather-query.repository.abstract";
import { WeatherQuery } from "../../domain/entities/weather-query.entity";

@Injectable()
export class WeatherFetchedHandler implements OnModuleInit {
    private readonly logger = new Logger(WeatherFetchedHandler.name);
    private readonly subscriber: Redis;

    constructor(
        private readonly weatherQueryRepository: WeatherQueryRepositoryPort,
    ) {
        this.subscriber = new Redis();
    }

    onModuleInit() {
        this.subscriber.subscribe("events:WeatherFetchedEvent");
        this.subscriber.on("message", (channel, message) => {
            if (channel === "events:WeatherFetchedEvent") {
                this.handleWeatherFetched(message);
            }
        });
        this.logger.log("WeatherFetchedHandler initialized");
    }

    private async handleWeatherFetched(message: string) {
        try {
            const event: WeatherFetchedEvent = JSON.parse(message);

            const weatherQuery = WeatherQuery.create({
                location: event.location,
                service_1_temperature: event.service1Temperature,
                service_2_temperature: event.service2Temperature,
                request_count: event.requestCount,
            });

            await this.weatherQueryRepository.create(weatherQuery);

            this.logger.log(`Weather data logged for ${event.location}`);
        } catch (error) {
            this.logger.error(
                `Failed to handle WeatherFetchedEvent: ${error.message}`,
            );
        }
    }
}
