import { Injectable, Logger } from "@nestjs/common";
import { EventBusService } from "../../domain/abstracts/services/event-bus.service.abstract";
import Redis from "ioredis";

@Injectable()
export class RedisEventBusService extends EventBusService {
    private readonly logger = new Logger(RedisEventBusService.name);
    private readonly redis: Redis;

    constructor() {
        super();
        this.redis = new Redis();
    }

    async publish<T>(event: T): Promise<void> {
        try {
            const eventName = RedisEventBusService.name;
            const channel = `events:${eventName}`;
            const payload = JSON.stringify(event);

            await this.redis.publish(channel, payload);
            this.logger.log(`Event published: ${eventName}`);
        } catch (error) {
            this.logger.error(`Failed to publish event: ${error.message}`);
        }
    }
}
