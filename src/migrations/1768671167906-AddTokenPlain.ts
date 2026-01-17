import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenPlain1768671167906 implements MigrationInterface {
    name = 'AddTokenPlain1768671167906'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" ADD "tokenPlain" character varying`);
        await queryRunner.query(`ALTER TABLE "tokens" ADD CONSTRAINT "UQ_ffa7d05ff07590b68436e72979a" UNIQUE ("tokenPlain")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "UQ_ffa7d05ff07590b68436e72979a"`);
        await queryRunner.query(`ALTER TABLE "tokens" DROP COLUMN "tokenPlain"`);
    }

}
