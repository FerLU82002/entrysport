import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega una galería de fotos adicionales (además de la portada `imagen_url`
 * ya existente) a canchas y locales.
 */
export class FotosCanchasYLocales1785692884442 implements MigrationInterface {
  name = 'FotosCanchasYLocales1785692884442';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "canchas" ADD COLUMN IF NOT EXISTS "fotos" text[] NOT NULL DEFAULT '{}'
    `);
    await queryRunner.query(`
      ALTER TABLE "locales" ADD COLUMN IF NOT EXISTS "fotos" text[] NOT NULL DEFAULT '{}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "locales" DROP COLUMN "fotos"`);
    await queryRunner.query(`ALTER TABLE "canchas" DROP COLUMN "fotos"`);
  }
}
