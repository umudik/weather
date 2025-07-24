import { Injectable } from "@nestjs/common";
import { CacheService } from "../../domain/abstracts/services/cache.service.abstract";
import Redis from "ioredis";

@Injectable()
export class RedisCacheService extends CacheService {
    private readonly redis: Redis;
    private readonly pub: Redis;
    private readonly sub: Redis;

    constructor() {
        super();
        this.redis = new Redis();
        this.pub = new Redis();
        this.sub = new Redis();
    }

    async get<T = any>(key: string): Promise<T | null> {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
    }

    async set<T = any>(
        key: string,
        value: T,
        ttlSeconds?: number,
    ): Promise<void> {
        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
            await this.redis.set(key, serialized, "EX", ttlSeconds);
        } else {
            await this.redis.set(key, serialized);
        }
    }

    async del(key: string): Promise<void> {
        await this.redis.del(key);
    }

    async publish(channel: string, message: string): Promise<number> {
        return this.pub.publish(channel, message);
    }

    async subscribe(
        channel: string,
        handler: (channel: string, message: string) => void,
    ): Promise<void> {
        await this.sub.subscribe(channel);
        this.sub.on("message", handler);
    }

    async unsubscribe(channel: string): Promise<void> {
        await this.sub.unsubscribe(channel);
    }
}
