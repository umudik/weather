export abstract class EventBusService {
    abstract publish<T>(event: T): Promise<void>;
}
