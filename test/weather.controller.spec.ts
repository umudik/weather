import { WeatherController } from "../src/presentation/controllers/weather.controller";
import { GetWeatherUseCase } from "../src/application/usecases/get-weather.usecase";
import { WeatherRequestDto } from "../src/presentation/dtos/weather-request.dto";
import { BatchManagementService } from "../src/domain/services/batch-management.service";
import {
    DomainError,
    InfrastructureError,
    LocationNotFoundError,
    WeatherServiceError,
} from "../src/domain/errors/service.error";

describe("WeatherController Critical Tests", () => {
    let controller: WeatherController;
    let mockUseCase: jest.Mocked<GetWeatherUseCase>;
    let mockBatchService: jest.Mocked<BatchManagementService>;

    beforeEach(() => {
        mockUseCase = {
            execute: jest.fn(),
        } as any;

        mockBatchService = {
            batchExecute: jest.fn(),
        } as any;

        controller = new WeatherController(mockUseCase, mockBatchService);
    });

    it("should process weather request for Istanbul", async () => {
        const mockResult = {
            location: "Istanbul",
            temperature: 30,
            logId: "test-log-1",
        };
        mockUseCase.execute.mockResolvedValue(mockResult);

        const query: WeatherRequestDto = { q: "Istanbul" };

        mockBatchService.batchExecute.mockResolvedValue(mockResult);

        const result = await controller.getWeather(query);

        expect(result).toEqual({
            location: "Istanbul",
            temperature: 30,
        });
        expect(mockBatchService.batchExecute).toHaveBeenCalledWith(
            "Istanbul",
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(Function),
        );
    });

    it("should process weather request for Eskişehir", async () => {
        const mockResult = {
            location: "Eskişehir",
            temperature: 25,
            logId: "test-log-2",
        };
        mockUseCase.execute.mockResolvedValue(mockResult);

        const query: WeatherRequestDto = { q: "Eskişehir" };

        mockBatchService.batchExecute.mockResolvedValue(mockResult);

        const result = await controller.getWeather(query);

        expect(result).toEqual({
            location: "Eskişehir",
            temperature: 25,
        });
        expect(mockBatchService.batchExecute).toHaveBeenCalledWith(
            "Eskişehir",
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(Function),
        );
    });

    it("should handle batch management for same location requests", async () => {
        const mockResult = { location: "Ankara", temperature: 22 };

        mockBatchService.batchExecute.mockResolvedValue(mockResult);

        const query: WeatherRequestDto = { q: "Ankara" };

        const [result1, result2, result3] = await Promise.all([
            controller.getWeather(query),
            controller.getWeather(query),
            controller.getWeather(query),
        ]);

        expect(result1).toEqual(mockResult);
        expect(result2).toEqual(mockResult);
        expect(result3).toEqual(mockResult);

        expect(mockBatchService.batchExecute).toHaveBeenCalledTimes(3);
        expect(mockBatchService.batchExecute).toHaveBeenCalledWith(
            "Ankara",
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(Function),
        );
    });

    it("should handle DomainError (LocationNotFoundError) gracefully", async () => {
        const locationError = new LocationNotFoundError();

        mockUseCase.execute.mockRejectedValue(locationError);

        mockBatchService.batchExecute.mockRejectedValue(locationError);

        const query: WeatherRequestDto = { q: "NonExistentCity" };

        await expect(controller.getWeather(query)).rejects.toThrow(
            DomainError,
        );
        await expect(controller.getWeather(query)).rejects.toThrow(
            LocationNotFoundError,
        );
    });

    it("should handle infrastructure errors gracefully", async () => {
        const serviceError = new WeatherServiceError(
            "All weather services are unavailable",
            "Istanbul",
        );

        mockUseCase.execute.mockRejectedValue(serviceError);

        mockBatchService.batchExecute.mockRejectedValue(serviceError);

        const query: WeatherRequestDto = { q: "Istanbul" };

        await expect(controller.getWeather(query)).rejects.toThrow(
            InfrastructureError,
        );
        await expect(controller.getWeather(query)).rejects.toThrow(
            WeatherServiceError,
        );
    });

    it("should normalize location for batching (trim only)", async () => {
        const mockResult = { location: "Istanbul", temperature: 28 };

        mockBatchService.batchExecute.mockResolvedValue(mockResult);

        await controller.getWeather({ q: " Istanbul " });
        await controller.getWeather({ q: "Istanbul" });
        await controller.getWeather({ q: "Istanbul " });

        expect(mockBatchService.batchExecute).toHaveBeenCalledTimes(3);
        expect(mockBatchService.batchExecute).toHaveBeenCalledWith(
            "Istanbul",
            expect.any(Number),
            expect.any(Number),
            expect.any(Number),
            expect.any(Function),
        );
    });
});
