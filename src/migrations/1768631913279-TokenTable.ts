import { MigrationInterface, QueryRunner } from "typeorm";

export class TokenTable1768631913279 implements MigrationInterface {
    name = 'TokenTable1768631913279'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."token_devices_platform_enum" AS ENUM('win', 'mac')`);
        await queryRunner.query(`CREATE TABLE "token_devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tokenId" uuid NOT NULL, "deviceFpHash" character varying NOT NULL, "deviceName" character varying, "platform" "public"."token_devices_platform_enum", "appVersion" character varying, "firstSeenAt" TIMESTAMP NOT NULL DEFAULT now(), "lastSeenAt" TIMESTAMP, "revokedAt" TIMESTAMP, CONSTRAINT "PK_34cc4e2369ab085d0356262e301" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0f5fecea7a49494d2cd0854ebb" ON "token_devices" ("deviceFpHash") `);
        await queryRunner.query(`CREATE TYPE "public"."tokens_type_enum" AS ENUM('LICENSE_LIFETIME_BYO', 'LICENSE_MONTHLY_FULL')`);
        await queryRunner.query(`CREATE TYPE "public"."tokens_status_enum" AS ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."tokens_type_enum" NOT NULL, "tokenHash" character varying NOT NULL, "status" "public"."tokens_status_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "startsAt" TIMESTAMP, "expiresAt" TIMESTAMP, "maxDevices" integer NOT NULL DEFAULT '1', "meta" jsonb, "lastUsedAt" TIMESTAMP, CONSTRAINT "UQ_d089468ffba8d8ad3954f9d82df" UNIQUE ("tokenHash"), CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d089468ffba8d8ad3954f9d82d" ON "tokens" ("tokenHash") `);
        await queryRunner.query(`ALTER TABLE "token_devices" ADD CONSTRAINT "FK_79a2d43d89883d98034dd8054c0" FOREIGN KEY ("tokenId") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token_devices" DROP CONSTRAINT "FK_79a2d43d89883d98034dd8054c0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d089468ffba8d8ad3954f9d82d"`);
        await queryRunner.query(`DROP TABLE "tokens"`);
        await queryRunner.query(`DROP TYPE "public"."tokens_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tokens_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0f5fecea7a49494d2cd0854ebb"`);
        await queryRunner.query(`DROP TABLE "token_devices"`);
        await queryRunner.query(`DROP TYPE "public"."token_devices_platform_enum"`);
    }

}
