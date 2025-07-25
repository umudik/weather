import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWeatherQuery1753445631856 implements MigrationInterface {
    name = 'CreateWeatherQuery1753445631856'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "weather_queries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "location" character varying(255) NOT NULL, "service_1_temperature" numeric(5,2) NOT NULL, "service_2_temperature" numeric(5,2) NOT NULL, "request_count" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4e591da0b33d74ad8b4ac58eb48" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4da66759c554a7784fa77f020f" ON "weather_queries" ("location") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_4da66759c554a7784fa77f020f"`);
        await queryRunner.query(`DROP TABLE "weather_queries"`);
    }

}
