import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'grassbooking',
  synchronize: true,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
});

const DIAS: string[] = [
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
];

async function seed() {
  await AppDataSource.initialize();
  console.log('Conectado a la base de datos');

  const superAdminHash = await bcrypt.hash('SuperAdmin123!', 12);
  const adminLocalHash = await bcrypt.hash('AdminLocal123!', 12);
  const demoHash = await bcrypt.hash('Demo123!', 12);

  await AppDataSource.query(`
    INSERT INTO usuarios (nombre, email, telefono, password_hash, rol)
    VALUES
      ('Super Administrador', 'superadmin@grassbooking.com', '062123456', $1, 'super_admin'),
      ('Usuario Demo', 'usuario@demo.com', '987654321', $2, 'usuario')
    ON CONFLICT (email) DO NOTHING
  `, [superAdminHash, demoHash]);

  console.log('Usuarios base creados');

  await AppDataSource.query(`
    INSERT INTO locales (nombre, descripcion, direccion, telefono, email, estado)
    VALUES (
      'Complejo Deportivo Grass Bambino',
      'Complejo con múltiples espacios deportivos: fútbol, pádel y vóley',
      'Av. Principal 123, Lima',
      '062123456',
      'contacto@grassbambino.com',
      'activo'
    )
    ON CONFLICT DO NOTHING
  `);

  const localResult = await AppDataSource.query(
    `SELECT id FROM locales WHERE nombre = 'Complejo Deportivo Grass Bambino' LIMIT 1`,
  );
  const localId = localResult[0]?.id;

  if (!localId) {
    console.error('No se pudo obtener el ID del local');
    process.exit(1);
  }

  await AppDataSource.query(
    `INSERT INTO configuraciones_pago (id_local) VALUES ($1) ON CONFLICT DO NOTHING`,
    [localId],
  );

  await AppDataSource.query(
    `
    INSERT INTO usuarios (nombre, email, telefono, password_hash, rol, id_local)
    VALUES ('Administrador Grass Bambino', 'admin@grassbambino.com', '062123456', $1, 'admin_local', $2)
    ON CONFLICT (email) DO NOTHING
  `,
    [adminLocalHash, localId],
  );

  console.log('Local y administrador de local creados');

  await AppDataSource.query(
    `
    INSERT INTO canchas (id_local, nombre, deporte, tipo_superficie, precio_hora_dia, precio_hora_noche, estado, descripcion)
    VALUES
      ($1, 'Cancha 1 - Fútbol 7', 'Fútbol', 'Césped sintético', 50.00, 70.00, 'activa', 'Cancha de césped sintético profesional con iluminación LED, vestuarios y estacionamiento'),
      ($1, 'Cancha 2 - Pádel', 'Pádel', 'Cristal', 40.00, 55.00, 'activa', 'Cancha de pádel techada con cristal panorámico')
    ON CONFLICT DO NOTHING
  `,
    [localId],
  );

  console.log('Canchas creadas');

  const canchasResult = await AppDataSource.query(
    `SELECT id FROM canchas WHERE id_local = $1`,
    [localId],
  );

  const horariosValues: string[] = [];
  const horariosParams: (string | number)[] = [];
  let paramIdx = 1;

  for (const { id: canchaId } of canchasResult) {
    for (const dia of DIAS) {
      for (let hora = 8; hora < 23; hora++) {
        const horaInicio = `${String(hora).padStart(2, '0')}:00`;
        const horaFin = `${String(hora + 1).padStart(2, '0')}:00`;

        horariosValues.push(
          `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`,
        );
        horariosParams.push(canchaId, dia, horaInicio, horaFin);
      }
    }
  }

  await AppDataSource.query(
    `INSERT INTO horarios (id_cancha, dia_semana, hora_inicio, hora_fin)
     VALUES ${horariosValues.join(', ')}
     ON CONFLICT DO NOTHING`,
    horariosParams,
  );

  console.log(`Horarios creados para ${canchasResult.length} cancha(s)`);
  console.log('\n=== SEED COMPLETADO ===');
  console.log('Super admin: superadmin@grassbooking.com / SuperAdmin123!');
  console.log('Admin local: admin@grassbambino.com / AdminLocal123!');
  console.log('Demo:        usuario@demo.com / Demo123!');
  console.log('Local ID:', localId);

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
