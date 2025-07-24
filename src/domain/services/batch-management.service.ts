import { Injectable, Logger } from "@nestjs/common";
import { UpdateWeatherRequestCountUseCase } from "../../application/usecases/update-weather-request-count.usecase";

const BATCH_PREFIX = "batch:weather:";
const CLEAR_BATCH_MULTIPLIER = 5;

interface BatchGroup {
    batchKey: string;
    endTime: number;
    promise: Promise<any>;
    requestCount: number;
    timeoutId?: NodeJS.Timeout;
    factoryPromise?: Promise<any>;
    resolver: (value: any) => void;
}

@Injectable()
export class BatchManagementService {
    private pendingBatches: BatchGroup[] = [];
    private readonly logger = new Logger(BatchManagementService.name);

    constructor(
        private readonly updateWeatherRequestCountUseCase:
            UpdateWeatherRequestCountUseCase,
    ) {}

    async batchExecute<T>(
        key: string,
        now: number,
        timeoutMs: number,
        maxBatchSize: number,
        factory: () => Promise<T>,
    ): Promise<T> {
        const batchKey = BATCH_PREFIX + key;

        this.pendingBatches = this.pendingBatches.filter( // Reviewer note: Memory leak on high load. TODO: Fix it.
            (batch) =>
                (batch.endTime + timeoutMs * CLEAR_BATCH_MULTIPLIER) > now,
        );

        const closestBatch = this.pendingBatches
            .filter(
                (batch) =>
                    batch.endTime > now &&
                    batch.batchKey === batchKey,
            )
            .sort((a, b) => b.endTime - a.endTime)[0];

        if (closestBatch) {
            closestBatch.requestCount++;

            if (closestBatch.requestCount >= maxBatchSize) {
                if (closestBatch.timeoutId) {
                    clearTimeout(closestBatch.timeoutId);
                }

                const factoryResponse = await closestBatch.factoryPromise;

                if (this.hasLogId(factoryResponse)) {
                    this.updateWeatherRequestCountUseCase.execute({
                        logId: factoryResponse.logId,
                        requestCount: closestBatch.requestCount,
                    }).catch((error) => {
                        this.logger.error(
                            "Failed to update request count:",
                            error,
                        );
                    });
                }

                closestBatch.resolver(factoryResponse);

                this.pendingBatches = this.pendingBatches.filter((b) =>
                    b !== closestBatch
                );
            }

            return closestBatch.promise;
        }

        const factoryPromise = factory();

        let resolvePromise: (value: any) => void;
        const promise = new Promise<T>((resolve) => {
            resolvePromise = resolve;
        });

        const timeoutId = setTimeout(async () => {
            const factoryResponse = await factoryPromise;

            const currentBatch = this.pendingBatches.find((b) =>
                b.batchKey === batchKey
            );

            if (this.hasLogId(factoryResponse) && currentBatch) {
                this.updateWeatherRequestCountUseCase.execute({
                    logId: factoryResponse.logId,
                    requestCount: currentBatch.requestCount,
                }).catch((error) => {
                    console.error("Failed to update request count:", error);
                });
            }

            resolvePromise(factoryResponse);

            if (currentBatch) {
                this.pendingBatches = this.pendingBatches.filter((b) =>
                    b !== currentBatch
                );
            }
        }, timeoutMs);

        this.pendingBatches.push({
            batchKey,
            endTime: now + timeoutMs,
            promise,
            requestCount: 1,
            timeoutId,
            factoryPromise,
            resolver: resolvePromise!,
        });

        return promise;
    }

    hasLogId(response: any): response is { logId: string } {
        return response && typeof response === "object" &&
            typeof response.logId === "string";
    }
}
