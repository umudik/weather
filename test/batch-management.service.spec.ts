import { Test, TestingModule } from "@nestjs/testing";
import { BatchManagementService } from "../src/domain/services/batch-management.service";
import { UpdateWeatherRequestCountUseCase } from "../src/application/usecases/update-weather-request-count.usecase";

interface WeatherResult {
    location: string;
    temperature: number;
    logId?: string;
}

describe("BatchManagementService", () => {
    let batchService: BatchManagementService;
    let updateWeatherRequestCountUseCase: jest.Mocked<
        UpdateWeatherRequestCountUseCase
    >;
    let batchCompletedCallback: jest.Mock;

    beforeEach(async () => {
        const mockUpdateWeatherRequestCountUseCase = {
            execute: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BatchManagementService,
                {
                    provide: UpdateWeatherRequestCountUseCase,
                    useValue: mockUpdateWeatherRequestCountUseCase,
                },
            ],
        }).compile();

        batchService = module.get<BatchManagementService>(
            BatchManagementService,
        );
        updateWeatherRequestCountUseCase = module.get(
            UpdateWeatherRequestCountUseCase,
        );

        batchCompletedCallback = jest.fn();
        batchService.setBatchCompletedCallback(batchCompletedCallback);

        batchService.setBatchCompletedCallback(async (event) => {
            await updateWeatherRequestCountUseCase.execute({
                logId: event.logId!,
                requestCount: event.requestCount,
            });
            batchCompletedCallback(event);
        });
    });

    describe("Basic Batching Logic", () => {
        it("should batch multiple requests and execute once", async () => {
            const mockResult: WeatherResult = {
                location: "Istanbul",
                temperature: 25,
                logId: "log-1",
            };
            const mockFactory = jest.fn().mockResolvedValue(mockResult);

            const promises = Array.from(
                { length: 3 },
                () =>
                    batchService.batchExecute(
                        "istanbul",
                        Date.now(),
                        100,
                        10,
                        mockFactory,
                    ),
            );

            const results = await Promise.all(promises);

            expect(mockFactory).toHaveBeenCalledTimes(1);
            expect(results).toHaveLength(3);
            results.forEach((result) => expect(result).toEqual(mockResult));
            expect(batchCompletedCallback).toHaveBeenCalledWith({
                logId: "log-1",
                requestCount: 3,
            });
        });

        it("should create separate batches for different locations", async () => {
            const istanbulResult: WeatherResult = {
                location: "Istanbul",
                temperature: 25,
                logId: "log-istanbul",
            };
            const ankaraResult: WeatherResult = {
                location: "Ankara",
                temperature: 20,
                logId: "log-ankara",
            };

            const istanbulFactory = jest.fn().mockResolvedValue(istanbulResult);
            const ankaraFactory = jest.fn().mockResolvedValue(ankaraResult);

            const [istanbulRes, ankaraRes] = await Promise.all([
                batchService.batchExecute(
                    "istanbul",
                    Date.now(),
                    100,
                    10,
                    istanbulFactory,
                ),
                batchService.batchExecute(
                    "ankara",
                    Date.now(),
                    100,
                    10,
                    ankaraFactory,
                ),
            ]) as [WeatherResult, WeatherResult];

            expect(istanbulFactory).toHaveBeenCalledTimes(1);
            expect(ankaraFactory).toHaveBeenCalledTimes(1);
            expect(istanbulRes.location).toBe("Istanbul");
            expect(ankaraRes.location).toBe("Ankara");
        });
    });

    describe("Max Batch Size Behavior", () => {
        it("should execute immediately when max batch size reached", async () => {
            const mockResult: WeatherResult = {
                location: "Istanbul",
                temperature: 25,
                logId: "log-1",
            };
            const mockFactory = jest.fn().mockResolvedValue(mockResult);

            const promises = Array.from(
                { length: 10 },
                () =>
                    batchService.batchExecute(
                        "istanbul",
                        Date.now(),
                        5000,
                        10,
                        mockFactory,
                    ),
            );

            const results = await Promise.all(promises);

            expect(mockFactory).toHaveBeenCalledTimes(1);
            expect(results).toHaveLength(10);
            expect(updateWeatherRequestCountUseCase.execute)
                .toHaveBeenCalledWith(
                    expect.objectContaining({ requestCount: 10 }),
                );
        });

        it("should create new batch after max size completed", async () => {
            const mockFactory = jest.fn()
                .mockResolvedValueOnce({
                    location: "Istanbul",
                    temperature: 25,
                    logId: "log-1",
                })
                .mockResolvedValueOnce({
                    location: "Istanbul",
                    temperature: 30,
                    logId: "log-2",
                });

            const firstBatch = Array.from(
                { length: 10 },
                () =>
                    batchService.batchExecute(
                        "istanbul",
                        Date.now(),
                        5000,
                        10,
                        mockFactory,
                    ),
            );
            await Promise.all(firstBatch);

            await new Promise((resolve) => setTimeout(resolve, 100));

            const secondBatch = Array.from(
                { length: 10 },
                () =>
                    batchService.batchExecute(
                        "istanbul",
                        Date.now() + 6000,
                        5000,
                        10,
                        mockFactory,
                    ),
            );
            await Promise.all(secondBatch);

            expect(mockFactory).toHaveBeenCalledTimes(2);
            expect(updateWeatherRequestCountUseCase.execute)
                .toHaveBeenCalledTimes(2);
        });
    });

    describe("Timeout Behavior", () => {
        it("should execute after timeout when less than max batch size", async () => {
            const mockResult: WeatherResult = {
                location: "Istanbul",
                temperature: 25,
                logId: "log-1",
            };
            const mockFactory = jest.fn().mockResolvedValue(mockResult);

            const promises = Array.from(
                { length: 5 },
                () =>
                    batchService.batchExecute(
                        "istanbul",
                        Date.now(),
                        100,
                        10,
                        mockFactory,
                    ),
            );

            const results = await Promise.all(promises);

            expect(mockFactory).toHaveBeenCalledTimes(1);
            expect(results).toHaveLength(5);
            expect(updateWeatherRequestCountUseCase.execute)
                .toHaveBeenCalledWith(
                    expect.objectContaining({ requestCount: 5 }),
                );
        });
    });
});
