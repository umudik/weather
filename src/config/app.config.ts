export interface AppConfig {
    weatherApiKey: string;
    weatherstackApiKey: string;
    redisUrl: string;
    port: number;
    dbSynchronize: boolean;
    databaseUrl: string;
}

export default (): AppConfig => ({
    weatherApiKey: process.env.WEATHER_API_KEY || "",
    weatherstackApiKey: process.env.WEATHERSTACK_API_KEY || "",
    redisUrl: process.env.REDIS_URL!,
    port: parseInt(process.env.PORT || "3000", 10),
    dbSynchronize: process.env.DB_SYNCHRONIZE === "true",
    databaseUrl: process.env.DATABASE_URL!,
});
