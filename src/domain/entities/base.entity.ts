import { PrimaryGeneratedColumn } from "typeorm";
import { randomUUID } from "crypto";

export abstract class BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    static create<T extends BaseEntity>(
        this: new () => T,
        data: Partial<T>,
    ): T {
        const instance = new this();
        instance.id = randomUUID();
        Object.assign(instance, data);
        return instance;
    }
}
