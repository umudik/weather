import { BaseRepository } from "./base-repository.abstract";
import { WeatherQuery } from "../../entities/weather-query.entity";

export abstract class WeatherQueryRepositoryPort
    extends BaseRepository<WeatherQuery> {
    abstract updateRequestCount(id: string, count: number): Promise<void>;
}
