import { Injectable, Logger } from "@nestjs/common";

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

export interface BatchCompletedEvent {
    logId?: string;
    requestCount: number;
}

@Injectable()
export class BatchManagementService {
    private pendingBatches: BatchGroup[] = [];
    private readonly logger = new Logger(BatchManagementService.name);
    private batchCompletedCallback?: (event: BatchCompletedEvent) => void;

    setBatchCompletedCallback(callback: (event: BatchCompletedEvent) => void) {
        this.batchCompletedCallback = callback;
    }

    async batchExecute<T>(
        key: string,
        now: number,
        timeoutMs: number,
        maxBatchSize: number,
        factory: () => Promise<T>,
    ): Promise<T> {
        const batchKey = BATCH_PREFIX + key;

        this.pendingBatches = this.pendingBatches.filter( // Dev note: May increase memory use in high traffic. TODO: Find better solution.
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

                this.notifyBatchCompleted(
                    factoryResponse,
                    closestBatch.requestCount,
                );

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

            if (currentBatch) {
                this.notifyBatchCompleted(
                    factoryResponse,
                    currentBatch.requestCount,
                );
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

    private notifyBatchCompleted(response: any, requestCount: number) {
        if (this.batchCompletedCallback && this.hasLogId(response)) {
            this.batchCompletedCallback({
                logId: response.logId,
                requestCount,
            });
        }
    }

    hasLogId(response: any): response is { logId: string } {
        return response && typeof response === "object" &&
            typeof response.logId === "string";
    }
}
