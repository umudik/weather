import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { CustomValidationPipe } from "./presentation/pipes/validation.pipe";
import { ServiceErrorFilter } from "./presentation/filters/service-error.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalFilters(new ServiceErrorFilter());

  const config = new DocumentBuilder()
    .setTitle("Weather Service API")
    .setDescription("Weather request queue service with multiple providers")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("port")!;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger UI is available at: http://localhost:${port}/api`);
}

bootstrap();
