import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { WeatherModule } from "./modules/weather.module";
import appConfig from "./config/app.config";
import { WeatherQuery } from "./domain/entities/weather-query.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        url: configService.get<string>("databaseUrl"),
        entities: [WeatherQuery],
        synchronize: configService.get<boolean>("dbSynchronize"),
      }),
      inject: [ConfigService],
    }),
    WeatherModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
