import { Test, TestingModule } from "@nestjs/testing";
import { BatchManagementService } from "../src/domain/services/batch-management.service";
import { UpdateWeatherRequestCountUseCase } from "../src/application/usecases/update-weather-request-count.usecase";

describe("BatchManagementService - MaxBatchSize Tests", () => {
    let batchService: BatchManagementService;
    let updateWeatherRequestCountUseCase: jest.Mocked<
        UpdateWeatherRequestCountUseCase
    >;

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
    });

    describe("maxBatchSize behavior", () => {
        it("should execute immediately when 10 requests reached", async () => {
            const location = "Istanbul";
            const now = Date.now();
            const maxBatchSize = 10;
            let factoryCalls = 0;

            const mockFactory = jest.fn().mockImplementation(async () => {
                factoryCalls++;
                return {
                    location,
                    temperature: Math.random() * 30,
                    logId: `log-${factoryCalls}`,
                };
            });

            const promises = Array.from(
                { length: 10 },
                (_, i) =>
                    batchService.batchExecute(
                        location,
                        now + i,
                        5000,
                        maxBatchSize,
                        mockFactory,
                    ),
            );

            const results = await Promise.all(promises);

            expect(mockFactory).toHaveBeenCalledTimes(1);
            expect(results).toHaveLength(10);

            const firstResult = results[0];
            results.forEach((result) => {
                expect(result).toEqual(firstResult);
            });

            expect(updateWeatherRequestCountUseCase.execute)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        requestCount: 10,
                    }),
                );
        });

        it("should create new batch after 10 requests completed", async () => {
            const location = "Istanbul";
            const now = Date.now();
            const maxBatchSize = 10;
            let factoryCalls = 0;

            const mockFactory = jest.fn().mockImplementation(async () => {
                factoryCalls++;
                return {
                    location,
                    temperature: 10 + factoryCalls,
                    logId: `log-${factoryCalls}`,
                };
            });

            const firstBatchPromises = Array.from(
                { length: 10 },
                () =>
                    batchService.batchExecute(
                        location,
                        now,
                        5000,
                        maxBatchSize,
                        mockFactory,
                    ),
            );

            const firstResults = await Promise.all(firstBatchPromises);

            await new Promise((resolve) => setTimeout(resolve, 100));

            const secondBatchPromises = Array.from(
                { length: 10 },
                () =>
                    batchService.batchExecute(
                        location,
                        now + 6000,
                        5000,
                        maxBatchSize,
                        mockFactory,
                    ),
            );

            const secondResults = await Promise.all(secondBatchPromises);

            expect(mockFactory).toHaveBeenCalledTimes(2);

            expect((firstResults[0] as { temperature: number }).temperature)
                .not.toBe(
                    (secondResults[0] as { temperature: number }).temperature,
                );

            expect(updateWeatherRequestCountUseCase.execute)
                .toHaveBeenCalledTimes(2);
        });

        it("should handle 5 requests with timeout (not max batch size)", async () => {
            const location = "Istanbul";
            const now = Date.now();
            const maxBatchSize = 10;
            const timeout = 100;
            let factoryCalls = 0;

            const mockFactory = jest.fn().mockImplementation(async () => {
                factoryCalls++;
                return {
                    location,
                    temperature: 25,
                    logId: `log-${factoryCalls}`,
                };
            });

            const promises = Array.from(
                { length: 5 },
                () =>
                    batchService.batchExecute(
                        location,
                        now,
                        timeout,
                        maxBatchSize,
                        mockFactory,
                    ),
            );

            const results = await Promise.all(promises);

            expect(mockFactory).toHaveBeenCalledTimes(1);
            expect(results).toHaveLength(5);

            expect(updateWeatherRequestCountUseCase.execute)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        requestCount: 5,
                    }),
                );
        });

        it("should execute immediately on exactly 10th request", async () => {
            const location = "Istanbul";
            const now = Date.now();
            const maxBatchSize = 10;
            const executionTimes: number[] = [];

            const mockFactory = jest.fn().mockImplementation(async () => {
                executionTimes.push(Date.now());
                return {
                    location,
                    temperature: 25,
                    logId: "log-1",
                };
            });

            const promises: Promise<any>[] = [];

            for (let i = 0; i < 10; i++) {
                promises.push(
                    batchService.batchExecute(
                        location,
                        now + i * 10,
                        5000,
                        maxBatchSize,
                        mockFactory,
                    ),
                );

                if (i < 9) {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                }
            }

            const startTime = Date.now();
            await Promise.all(promises);
            const endTime = Date.now();

            expect(mockFactory).toHaveBeenCalledTimes(1);
            expect(endTime - startTime).toBeLessThan(1000);
        });
    });
});
