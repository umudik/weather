import { WeatherQuery } from "../../domain/entities/weather-query.entity";

export const typeOrmConfig = {
    type: "postgres" as const,
    entities: [WeatherQuery],
};
