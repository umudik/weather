import { Test, TestingModule } from "@nestjs/testing";
import { GetWeatherUseCase } from "../src/application/usecases/get-weather.usecase";
import { WeatherApiService } from "../src/infrastructure/services/openweather.service";
import { WeatherstackService } from "../src/infrastructure/services/weatherapi.service";
import { WeatherQueryRepositoryPort } from "../src/domain/abstracts/repositories/weather-query.repository.abstract";
import {
    LocationNotFoundError,
    WeatherServiceError,
} from "../src/domain/errors/service.error";

describe("GetWeatherUseCase", () => {
    let useCase: GetWeatherUseCase;
    let weatherApiService: jest.Mocked<WeatherApiService>;
    let weatherstackService: jest.Mocked<WeatherstackService>;
    let weatherQueryRepository: jest.Mocked<WeatherQueryRepositoryPort>;

    beforeEach(async () => {
        const mockWeatherApiService = {
            getWeather: jest.fn(),
        };

        const mockWeatherstackService = {
            getWeather: jest.fn(),
        };

        const mockWeatherQueryRepository = {
            create: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetWeatherUseCase,
                { provide: WeatherApiService, useValue: mockWeatherApiService },
                {
                    provide: WeatherstackService,
                    useValue: mockWeatherstackService,
                },
                {
                    provide: WeatherQueryRepositoryPort,
                    useValue: mockWeatherQueryRepository,
                },
            ],
        }).compile();

        useCase = module.get<GetWeatherUseCase>(GetWeatherUseCase);
        weatherApiService = module.get(WeatherApiService);
        weatherstackService = module.get(WeatherstackService);
        weatherQueryRepository = module.get(WeatherQueryRepositoryPort);
    });

    describe("execute", () => {
        it("should successfully fetch weather from both services and return average", async () => {
            const location = "Istanbul";
            weatherApiService.getWeather.mockResolvedValue(25);
            weatherstackService.getWeather.mockResolvedValue(30);
            weatherQueryRepository.create.mockResolvedValue(undefined);

            const result = await useCase.execute({ location });

            expect(result.location).toBe(location);
            expect(result.temperature).toBe(27.5);
            expect(result.logId).toBeDefined();
            expect(weatherApiService.getWeather).toHaveBeenCalledWith(location);
            expect(weatherstackService.getWeather).toHaveBeenCalledWith(
                location,
            );
            expect(weatherQueryRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    location,
                    service_1_temperature: 25,
                    service_2_temperature: 30,
                    request_count: 0,
                }),
            );
        });

        it("should work with one service failure", async () => {
            const location = "Istanbul";
            weatherApiService.getWeather.mockResolvedValue(25);
            weatherstackService.getWeather.mockRejectedValue(
                new WeatherServiceError("Service down", location),
            );
            weatherQueryRepository.create.mockResolvedValue(undefined);

            const result = await useCase.execute({ location });

            expect(result.temperature).toBe(25);
            expect(weatherQueryRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    service_1_temperature: 25,
                    service_2_temperature: 0,
                }),
            );
        });

        it("should throw LocationNotFoundError when both services return location not found", async () => {
            const location = "NonExistentCity";
            weatherApiService.getWeather.mockRejectedValue(
                new LocationNotFoundError(),
            );
            weatherstackService.getWeather.mockRejectedValue(
                new LocationNotFoundError(),
            );

            await expect(useCase.execute({ location })).rejects.toThrow(
                LocationNotFoundError,
            );
            expect(weatherQueryRepository.create).not.toHaveBeenCalled();
        });

        it("should throw WeatherServiceError when all services fail", async () => {
            const location = "Istanbul";
            weatherApiService.getWeather.mockRejectedValue(
                new WeatherServiceError("API down", location),
            );
            weatherstackService.getWeather.mockRejectedValue(
                new WeatherServiceError("API down", location),
            );

            await expect(useCase.execute({ location })).rejects.toThrow(
                WeatherServiceError,
            );
            expect(weatherQueryRepository.create).not.toHaveBeenCalled();
        });

        it("should create database log with request_count 0", async () => {
            const location = "Istanbul";
            weatherApiService.getWeather.mockResolvedValue(20);
            weatherstackService.getWeather.mockResolvedValue(25);
            weatherQueryRepository.create.mockResolvedValue(undefined);

            await useCase.execute({ location });

            expect(weatherQueryRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    request_count: 0,
                }),
            );
        });
    });
});
