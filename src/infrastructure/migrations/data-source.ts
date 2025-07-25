import { DataSource } from "typeorm";
import { WeatherQuery } from "../../domain/entities/weather-query.entity";
import appConfig from "../../config/app.config";

const config = appConfig();

export const AppDataSource = new DataSource({
    type: "postgres",
    url: config.databaseUrl,
    entities: [WeatherQuery],
    migrations: ["dist/infrastructure/migrations/*Migration.js"],
    migrationsTableName: "migrations",
    synchronize: false,
    logging: config.dbLogging,
});
