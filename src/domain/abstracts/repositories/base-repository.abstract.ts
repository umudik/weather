import { ObjectLiteral, Repository } from "typeorm";

export abstract class BaseRepository<T extends ObjectLiteral> {
    protected abstract repository: Repository<T>;

    async create(data: T): Promise<void> {
        await this.repository.save(data);
    }
}
