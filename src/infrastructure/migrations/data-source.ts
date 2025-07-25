import { DataSource } from "typeorm";
import { WeatherQuery } from "../../domain/entities/weather-query.entity";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL ||
        "postgresql://weather_user:weather_password@localhost:5432/weather_db",
    entities: [WeatherQuery],
    migrations: ["dist/infrastructure/migrations/*Migration.js"],
    migrationsTableName: "migrations",
    synchronize: false,
    logging: process.env.NODE_ENV === "development",
});
