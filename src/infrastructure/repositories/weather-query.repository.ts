import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WeatherQuery } from "../../domain/entities/weather-query.entity";
import { WeatherQueryRepositoryPort } from "../../domain/abstracts/repositories/weather-query.repository.abstract";

@Injectable()
export class WeatherQueryRepository extends WeatherQueryRepositoryPort {
    constructor(
        @InjectRepository(WeatherQuery) protected repository: Repository<
            WeatherQuery
        >,
    ) {
        super();
    }

    async updateRequestCount(id: string, count: number): Promise<void> {
        await this.repository.update(id, { request_count: count });
    }
}
