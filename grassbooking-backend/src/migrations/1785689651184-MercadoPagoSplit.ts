import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Introduce el modelo de pagos Split de Mercado Pago:
 * - cuentas_mercadopago: conexión OAuth de cada local (tokens cifrados).
 * - mercadopago_oauth_states: protección CSRF del flujo OAuth.
 * - webhook_eventos_pago: auditoría e idempotencia de notificaciones.
 * - pagos: columnas de distribución (comisión/neto), referencia externa e idempotencia.
 * - configuraciones_pago: se retiran los campos manuales de Mercado Pago
 *   (la conexión ahora es OAuth, vía cuentas_mercadopago).
 *
 * Generada a mano porque el proyecto no contaba con infraestructura de migraciones
 * (todo el esquema previo vivía bajo `synchronize: true`). Verificar con
 * `npm run migration:generate -- src/migrations/Check` (debe reportar "No changes in database schema were found")
 * después de correrla contra una base de desarrollo real.
 */
export class MercadoPagoSplit1785689651184 implements MigrationInterface {
  name = 'MercadoPagoSplit1785689651184';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    // --- cuentas_mercadopago ---
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "cuentas_mercadopago_estado_enum" AS ENUM ('pendiente', 'conectada', 'desconectada', 'error');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cuentas_mercadopago" (
        "id" SERIAL PRIMARY KEY,
        "id_local" integer NOT NULL,
        "mercadopago_user_id" text,
        "public_key" text,
        "access_token_enc" text,
        "refresh_token_enc" text,
        "token_type" varchar(30) NOT NULL DEFAULT 'bearer',
        "scope" text,
        "expira_en" TIMESTAMP,
        "live_mode" boolean NOT NULL DEFAULT false,
        "estado" "cuentas_mercadopago_estado_enum" NOT NULL DEFAULT 'pendiente',
        "error_mensaje" text,
        "conectado_en" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "actualizado_en" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_cuentas_mercadopago_id_local" UNIQUE ("id_local"),
        CONSTRAINT "fk_cuentas_mercadopago_local" FOREIGN KEY ("id_local")
          REFERENCES "locales"("id") ON DELETE CASCADE
      )
    `);

    // --- mercadopago_oauth_states ---
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mercadopago_oauth_states" (
        "id" SERIAL PRIMARY KEY,
        "id_local" integer NOT NULL,
        "id_usuario" integer NOT NULL,
        "state" text NOT NULL,
        "usado" boolean NOT NULL DEFAULT false,
        "expira_en" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_mercadopago_oauth_states_state" UNIQUE ("state")
      )
    `);

    // --- webhook_eventos_pago ---
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "webhook_eventos_pago_resultado_enum" AS ENUM
          ('aprobado', 'rechazado', 'ignorado_duplicado', 'pendiente', 'error_validacion');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      CREATE TABLE "webhook_eventos_pago" (
        "id" SERIAL PRIMARY KEY,
        "payment_id" text NOT NULL,
        "tipo_evento" varchar(50) NOT NULL DEFAULT 'payment',
        "id_reserva_detectada" integer,
        "resultado" "webhook_eventos_pago_resultado_enum" NOT NULL,
        "motivo_rechazo" text,
        "payload_crudo" jsonb,
        "procesado_en" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_webhook_eventos_pago_payment_id" ON "webhook_eventos_pago" ("payment_id")
    `);

    // --- pagos: columnas de split ---
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "pagos_estado_distribucion_enum" AS ENUM ('no_aplica', 'pendiente', 'distribuido', 'fallido');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      ALTER TABLE "pagos"
        ADD COLUMN IF NOT EXISTS "id_local" integer,
        ADD COLUMN IF NOT EXISTS "mercadopago_account_id" text,
        ADD COLUMN IF NOT EXISTS "preference_id" text,
        ADD COLUMN IF NOT EXISTS "external_reference" text,
        ADD COLUMN IF NOT EXISTS "monto_comision_plataforma" decimal(8,2),
        ADD COLUMN IF NOT EXISTS "monto_neto_local" decimal(8,2),
        ADD COLUMN IF NOT EXISTS "estado_distribucion" "pagos_estado_distribucion_enum" NOT NULL DEFAULT 'no_aplica',
        ADD COLUMN IF NOT EXISTS "idempotency_key" uuid,
        ADD COLUMN IF NOT EXISTS "fecha_ultima_actualizacion" TIMESTAMP NOT NULL DEFAULT now()
    `);
    // Backfill de idempotency_key para filas existentes antes de exigir NOT NULL + UNIQUE
    await queryRunner.query(`
      UPDATE "pagos" SET "idempotency_key" = gen_random_uuid() WHERE "idempotency_key" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "pagos"
        ALTER COLUMN "idempotency_key" SET NOT NULL,
        ALTER COLUMN "idempotency_key" SET DEFAULT gen_random_uuid()
    `);
    await queryRunner.query(`
      ALTER TABLE "pagos" ADD CONSTRAINT "uq_pagos_idempotency_key" UNIQUE ("idempotency_key")
    `);
    await queryRunner.query(`
      ALTER TABLE "pagos" ADD CONSTRAINT "uq_pagos_external_reference" UNIQUE ("external_reference")
    `);
    await queryRunner.query(`
      ALTER TABLE "pagos" ADD CONSTRAINT "fk_pagos_local" FOREIGN KEY ("id_local")
        REFERENCES "locales"("id") ON DELETE SET NULL
    `);

    // --- configuraciones_pago: retirar campos manuales de Mercado Pago ---
    await queryRunner.query(`
      ALTER TABLE "configuraciones_pago"
        DROP COLUMN IF EXISTS "mercadopago_activo",
        DROP COLUMN IF EXISTS "mercadopago_public_key",
        DROP COLUMN IF EXISTS "mercadopago_access_token_enc"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "configuraciones_pago"
        ADD COLUMN "mercadopago_activo" boolean NOT NULL DEFAULT false,
        ADD COLUMN "mercadopago_public_key" text,
        ADD COLUMN "mercadopago_access_token_enc" text
    `);

    await queryRunner.query(`ALTER TABLE "pagos" DROP CONSTRAINT "fk_pagos_local"`);
    await queryRunner.query(`ALTER TABLE "pagos" DROP CONSTRAINT "uq_pagos_external_reference"`);
    await queryRunner.query(`ALTER TABLE "pagos" DROP CONSTRAINT "uq_pagos_idempotency_key"`);
    await queryRunner.query(`
      ALTER TABLE "pagos"
        DROP COLUMN "id_local",
        DROP COLUMN "mercadopago_account_id",
        DROP COLUMN "preference_id",
        DROP COLUMN "external_reference",
        DROP COLUMN "monto_comision_plataforma",
        DROP COLUMN "monto_neto_local",
        DROP COLUMN "estado_distribucion",
        DROP COLUMN "idempotency_key",
        DROP COLUMN "fecha_ultima_actualizacion"
    `);
    await queryRunner.query(`DROP TYPE "pagos_estado_distribucion_enum"`);

    await queryRunner.query(`DROP INDEX "idx_webhook_eventos_pago_payment_id"`);
    await queryRunner.query(`DROP TABLE "webhook_eventos_pago"`);
    await queryRunner.query(`DROP TYPE "webhook_eventos_pago_resultado_enum"`);

    await queryRunner.query(`DROP TABLE "mercadopago_oauth_states"`);

    await queryRunner.query(`DROP TABLE "cuentas_mercadopago"`);
    await queryRunner.query(`DROP TYPE "cuentas_mercadopago_estado_enum"`);
  }
}
