import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { WeatherModule } from "./modules/weather.module";
import appConfig from "./config/app.config";
import { typeOrmConfig } from "./infrastructure/config/typeorm.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        ...typeOrmConfig,
        url: configService.get<string>("databaseUrl"),
        synchronize: configService.get<boolean>("dbSynchronize"),
        logging: configService.get<boolean>("dbLogging"),
      }),
      inject: [ConfigService],
    }),
    WeatherModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
