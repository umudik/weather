import { Column, CreateDateColumn, Entity, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("weather_queries")
@Index(["location"])
export class WeatherQuery extends BaseEntity {
    @Column("varchar", { length: 255 })
    location: string;

    @Column("decimal", { precision: 5, scale: 2 })
    service_1_temperature: number;

    @Column("decimal", { precision: 5, scale: 2 })
    service_2_temperature: number;

    @Column("integer")
    request_count: number;

    @CreateDateColumn()
    created_at: Date;
}
