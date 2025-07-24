import { Test, TestingModule } from "@nestjs/testing";
import { BatchManagementService } from "../src/domain/services/batch-management.service";

describe("BatchManagementService", () => {
    let batchService: BatchManagementService;
    let batchCompletedCallback: jest.Mock;

    beforeEach(async () => {
        jest.clearAllTimers();
        jest.useFakeTimers();

        const module: TestingModule = await Test.createTestingModule({
            providers: [BatchManagementService],
        }).compile();

        batchService = module.get<BatchManagementService>(
            BatchManagementService,
        );

        batchCompletedCallback = jest.fn();
        batchService.setBatchCompletedCallback(batchCompletedCallback);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe("timeout behavior", () => {
        it("should execute factory after timeout when less than max batch size", async () => {
            const location = "Istanbul";
            const now = Date.now();
            const timeout = 5000;
            const maxBatchSize = 10;

            const mockFactory = jest.fn().mockResolvedValue({
                location,
                temperature: 25,
                logId: "log-1",
            });

            const promise = batchService.batchExecute(
                location,
                now,
                timeout,
                maxBatchSize,
                mockFactory,
            );

            jest.advanceTimersByTime(timeout);

            const result = await promise as any;

            expect(mockFactory).toHaveBeenCalledTimes(1);
            expect(result.temperature).toBe(25);
            expect(batchCompletedCallback).toHaveBeenCalledWith({
                logId: "log-1",
                requestCount: 1,
            });
        });

        it("should batch multiple requests within timeout window", async () => {
            const location = "Istanbul";
            const now = Date.now();
            const timeout = 5000;
            const maxBatchSize = 10;

            const mockFactory = jest.fn().mockResolvedValue({
                location,
                temperature: 25,
                logId: "log-1",
            });

            const promise1 = batchService.batchExecute(
                location,
                now,
                timeout,
                maxBatchSize,
                mockFactory,
            );
            const promise2 = batchService.batchExecute(
                location,
                now + 100,
                timeout,
                maxBatchSize,
                mockFactory,
            );
            const promise3 = batchService.batchExecute(
                location,
                now + 200,
                timeout,
                maxBatchSize,
                mockFactory,
            );

            jest.advanceTimersByTime(timeout);

            const results = await Promise.all([
                promise1,
                promise2,
                promise3,
            ]) as any[];

            expect(mockFactory).toHaveBeenCalledTimes(1);
            expect(results).toHaveLength(3);

            results.forEach((result) => {
                expect(result.temperature).toBe(25);
            });

            expect(batchCompletedCallback).toHaveBeenCalledWith({
                logId: "log-1",
                requestCount: 3,
            });
        });
    });

    describe("batching logic", () => {
        it("should create separate batches for different locations", async () => {
            const now = Date.now();
            const timeout = 5000;
            const maxBatchSize = 10;

            const mockFactory1 = jest.fn().mockResolvedValue({
                location: "Istanbul",
                temperature: 25,
                logId: "log-istanbul",
            });

            const mockFactory2 = jest.fn().mockResolvedValue({
                location: "Ankara",
                temperature: 20,
                logId: "log-ankara",
            });

            const promise1 = batchService.batchExecute(
                "Istanbul",
                now,
                timeout,
                maxBatchSize,
                mockFactory1,
            );
            const promise2 = batchService.batchExecute(
                "Ankara",
                now,
                timeout,
                maxBatchSize,
                mockFactory2,
            );

            jest.advanceTimersByTime(timeout);

            const results = await Promise.all([promise1, promise2]) as any[];

            expect(mockFactory1).toHaveBeenCalledTimes(1);
            expect(mockFactory2).toHaveBeenCalledTimes(1);
            expect(results[0].location).toBe("Istanbul");
            expect(results[1].location).toBe("Ankara");
        });

        it("should join existing batch if within time window", async () => {
            const location = "Istanbul";
            const now = Date.now();
            const timeout = 5000;
            const maxBatchSize = 10;

            const mockFactory = jest.fn().mockResolvedValue({
                location,
                temperature: 25,
                logId: "log-1",
            });

            const promise1 = batchService.batchExecute(
                location,
                now,
                timeout,
                maxBatchSize,
                mockFactory,
            );

            jest.advanceTimersByTime(2000);
            const promise2 = batchService.batchExecute(
                location,
                now + 2000,
                timeout,
                maxBatchSize,
                mockFactory,
            );

            jest.advanceTimersByTime(3000);

            const results = await Promise.all([promise1, promise2]);

            expect(mockFactory).toHaveBeenCalledTimes(1);
            expect(results).toHaveLength(2);
            expect(batchCompletedCallback).toHaveBeenCalledWith({
                logId: "log-1",
                requestCount: 2,
            });
        });

        it("should create new batch if outside time window", async () => {
            const location = "Istanbul";
            const now = Date.now();
            const timeout = 5000;
            const maxBatchSize = 10;

            const mockFactory = jest.fn()
                .mockResolvedValueOnce({
                    location,
                    temperature: 25,
                    logId: "log-1",
                })
                .mockResolvedValueOnce({
                    location,
                    temperature: 30,
                    logId: "log-2",
                });

            const promise1 = batchService.batchExecute(
                location,
                now,
                timeout,
                maxBatchSize,
                mockFactory,
            );

            jest.advanceTimersByTime(timeout);
            await promise1;

            const promise2 = batchService.batchExecute(
                location,
                now + timeout + 1000,
                timeout,
                maxBatchSize,
                mockFactory,
            );

            jest.advanceTimersByTime(timeout);
            const result2 = await promise2 as any;

            expect(mockFactory).toHaveBeenCalledTimes(2);
            expect(result2.temperature).toBe(30);
            expect(batchCompletedCallback).toHaveBeenCalledTimes(2);
        });
    });

    describe("cleanup and memory management", () => {
        it("should clean up old batches", async () => {
            const location = "Istanbul";
            const now = Date.now();
            const timeout = 1000;
            const maxBatchSize = 10;

            const mockFactory = jest.fn().mockResolvedValue({
                location,
                temperature: 25,
                logId: "log-1",
            });

            const promise = batchService.batchExecute(
                location,
                now,
                timeout,
                maxBatchSize,
                mockFactory,
            );
            jest.advanceTimersByTime(timeout);
            await promise;

            const laterTime = now + 30000;
            const promise2 = batchService.batchExecute(
                location,
                laterTime,
                timeout,
                maxBatchSize,
                mockFactory,
            );
            jest.advanceTimersByTime(timeout);
            await promise2;

            expect(mockFactory).toHaveBeenCalledTimes(2);
        });

        it("should handle logId extraction correctly", async () => {
            const location = "Istanbul";
            const now = Date.now();
            const timeout = 5000;
            const maxBatchSize = 10;

            const mockFactoryWithLogId = jest.fn().mockResolvedValue({
                location,
                temperature: 25,
                logId: "test-log-id",
            });

            const promise = batchService.batchExecute(
                location,
                now,
                timeout,
                maxBatchSize,
                mockFactoryWithLogId,
            );
            jest.advanceTimersByTime(timeout);
            await promise;

            expect(batchCompletedCallback).toHaveBeenCalledWith({
                logId: "test-log-id",
                requestCount: 1,
            });
        });

        it("should handle response without logId gracefully", async () => {
            const location = "Istanbul";
            const now = Date.now();
            const timeout = 5000;
            const maxBatchSize = 10;

            const mockFactoryWithoutLogId = jest.fn().mockResolvedValue({
                location,
                temperature: 25,
            });

            const promise = batchService.batchExecute(
                location,
                now,
                timeout,
                maxBatchSize,
                mockFactoryWithoutLogId,
            );
            jest.advanceTimersByTime(timeout);
            await promise;

            expect(batchCompletedCallback).not.toHaveBeenCalled();
        });
    });
});
