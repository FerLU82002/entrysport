import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega columnas propias para el nombre y teléfono del cliente en reservas
 * manuales (antes se concatenaban dentro de "notas", lo que impedía mostrarlos
 * de forma confiable en la pastilla del calendario y en el modal de gestión).
 */
export class NombreClienteReserva1786401749052 implements MigrationInterface {
  name = 'NombreClienteReserva1786401749052';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reservas"
        ADD COLUMN "nombre_cliente" character varying(150),
        ADD COLUMN "telefono_cliente" character varying(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reservas"
        DROP COLUMN "nombre_cliente",
        DROP COLUMN "telefono_cliente"
    `);
  }
}
