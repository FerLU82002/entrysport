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

  const adminHash = await bcrypt.hash('Admin123!', 12);
  const demoHash = await bcrypt.hash('Demo123!', 12);

  await AppDataSource.query(`
    INSERT INTO usuarios (nombre, email, telefono, password_hash, rol)
    VALUES
      ('Administrador Grass Bambino', 'admin@grassbambino.com', '062123456', $1, 'admin'),
      ('Usuario Demo', 'usuario@demo.com', '987654321', $2, 'usuario')
    ON CONFLICT (email) DO NOTHING
  `, [adminHash, demoHash]);

  console.log('Usuarios creados');

  await AppDataSource.query(`
    INSERT INTO canchas (nombre, tipo_superficie, precio_hora, estado, descripcion)
    VALUES (
      'Cancha Grass Bambino',
      'Césped sintético',
      50.00,
      'activa',
      'Cancha de césped sintético profesional con iluminación LED, vestuarios y estacionamiento'
    )
    ON CONFLICT DO NOTHING
  `);

  console.log('Cancha creada');

  const canchaResult = await AppDataSource.query(
    `SELECT id FROM canchas WHERE nombre = 'Cancha Grass Bambino' LIMIT 1`
  );
  const canchaId = canchaResult[0]?.id;

  if (!canchaId) {
    console.error('No se pudo obtener el ID de la cancha');
    process.exit(1);
  }

  const horariosValues: string[] = [];
  const horariosParams: string[] = [];
  let paramIdx = 1;

  for (const dia of DIAS) {
    for (let hora = 8; hora < 23; hora++) {
      const horaInicio = `${String(hora).padStart(2, '0')}:00`;
      const horaFin = `${String(hora + 1).padStart(2, '0')}:00`;

      horariosValues.push(
        `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`
      );
      horariosParams.push(String(canchaId), dia, horaInicio, horaFin);
    }
  }

  await AppDataSource.query(
    `INSERT INTO horarios (id_cancha, dia_semana, hora_inicio, hora_fin)
     VALUES ${horariosValues.join(', ')}
     ON CONFLICT DO NOTHING`,
    horariosParams,
  );

  console.log(`${DIAS.length * 15} horarios creados (15 por día × 7 días)`);
  console.log('\n=== SEED COMPLETADO ===');
  console.log('Admin: admin@grassbambino.com / Admin123!');
  console.log('Demo:  usuario@demo.com / Demo123!');
  console.log('Cancha ID:', canchaId);

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
