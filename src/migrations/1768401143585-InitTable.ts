import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitTable1768401143585 implements MigrationInterface {
  name = 'InitTable1768401143585';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying NOT NULL, "status" "public"."jobs_status_enum" NOT NULL DEFAULT 'pending', "progress" integer NOT NULL DEFAULT '0', "videoUrl" character varying, "resultUrl" character varying, "errorMessage" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_status_enum"`);
  }
}
