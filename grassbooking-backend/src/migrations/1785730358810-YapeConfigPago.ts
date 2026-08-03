import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega el pago manual por Yape (QR + número de celular para WhatsApp)
 * a la configuración de pago de cada local.
 */
export class YapeConfigPago1785730358810 implements MigrationInterface {
  name = 'YapeConfigPago1785730358810';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "configuraciones_pago"
        ADD COLUMN "yape_activo" boolean NOT NULL DEFAULT false,
        ADD COLUMN "yape_qr_url" text,
        ADD COLUMN "yape_telefono" character varying(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "configuraciones_pago"
        DROP COLUMN "yape_activo",
        DROP COLUMN "yape_qr_url",
        DROP COLUMN "yape_telefono"
    `);
  }
}
