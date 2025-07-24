export class BaseClass {
    static create<T extends BaseClass>(this: new () => T, data: Partial<T>): T {
        const instance = new this();
        Object.assign(instance, data);
        return instance;
    }
}
