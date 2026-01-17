import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeviceFpPlain1768671706711 implements MigrationInterface {
    name = 'AddDeviceFpPlain1768671706711'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token_devices" ADD "deviceFpPlain" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token_devices" DROP COLUMN "deviceFpPlain"`);
    }

}
