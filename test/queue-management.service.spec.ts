import { Test, TestingModule } from "@nestjs/testing";
import { BatchManagementService } from "../src/domain/services/batch-management.service";

interface TestResult {
    location: string;
    temperature: number;
}

describe("BatchManagementService Critical Tests", () => {
    let service: BatchManagementService;

    beforeEach(async () => {
        jest.clearAllTimers();
        jest.useFakeTimers();

        const module: TestingModule = await Test.createTestingModule({
            providers: [BatchManagementService],
        }).compile();

        service = module.get<BatchManagementService>(BatchManagementService);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should execute immediately when 3 requests arrive", async () => {
        const mockResult: TestResult = {
            location: "Istanbul",
            temperature: 25,
        };
        const mockFactory = jest.fn((): Promise<TestResult> =>
            Promise.resolve(mockResult)
        );

        const now = Date.now();
        const timeout = 5000;
        const maxBatchSize = 3;

        const promises = Array.from(
            { length: 3 },
            () =>
                service.batchExecute(
                    "istanbul",
                    now,
                    timeout,
                    maxBatchSize,
                    mockFactory,
                ),
        );

        const results = await Promise.all(promises) as TestResult[];

        results.forEach((result) => {
            expect(result).toEqual(mockResult);
        });

        expect(mockFactory).toHaveBeenCalledTimes(1);
    }, 5000);

    it(
        "should share same function call for 2 requests within timeout",
        async () => {
            const mockResult: TestResult = {
                location: "Ankara",
                temperature: 22,
            };
            const mockFactory = jest.fn((): Promise<TestResult> =>
                Promise.resolve(mockResult)
            );

            const now = Date.now();
            const timeout = 100;
            const maxBatchSize = 10;

            const promise1 = service.batchExecute(
                "ankara",
                now,
                timeout,
                maxBatchSize,
                mockFactory,
            );

            const promise2 = service.batchExecute(
                "ankara",
                now + 10,
                timeout,
                maxBatchSize,
                mockFactory,
            );

            jest.advanceTimersByTime(timeout);

            const results = await Promise.all([
                promise1,
                promise2,
            ]) as TestResult[];

            results.forEach((result) => {
                expect(result).toEqual(mockResult);
            });

            expect(mockFactory).toHaveBeenCalledTimes(1);
        },
        5000,
    );

    it("should handle different locations separately", async () => {
        const istanbulResult: TestResult = {
            location: "Istanbul",
            temperature: 25,
        };
        const londonResult: TestResult = {
            location: "London",
            temperature: 15,
        };

        const istanbulFactory = jest.fn((): Promise<TestResult> =>
            Promise.resolve(istanbulResult)
        );
        const londonFactory = jest.fn((): Promise<TestResult> =>
            Promise.resolve(londonResult)
        );

        const now = Date.now();
        const timeout = 100;
        const maxBatchSize = 10;

        const promises = Promise.all([
            service.batchExecute(
                "istanbul",
                now,
                timeout,
                maxBatchSize,
                istanbulFactory,
            ),
            service.batchExecute(
                "london",
                now,
                timeout,
                maxBatchSize,
                londonFactory,
            ),
        ]);

        jest.advanceTimersByTime(timeout);

        const [istanbulRes, londonRes] = await promises as TestResult[];

        expect(istanbulRes.location).toBe("Istanbul");
        expect(londonRes.location).toBe("London");
        expect(istanbulFactory).toHaveBeenCalledTimes(1);
        expect(londonFactory).toHaveBeenCalledTimes(1);
    }, 5000);
});
