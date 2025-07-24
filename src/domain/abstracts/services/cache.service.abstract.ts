export abstract class CacheService {
    abstract get<T = any>(key: string): Promise<T | null>;
    abstract set<T = any>(
        key: string,
        value: T,
        ttlSeconds?: number,
    ): Promise<void>;
    abstract del(key: string): Promise<void>;
    abstract publish(channel: string, message: string): Promise<number>;
    abstract subscribe(
        channel: string,
        handler: (channel: string, message: string) => void,
    ): Promise<void>;
    abstract unsubscribe(channel: string): Promise<void>;
}
