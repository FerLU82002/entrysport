import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { CanchasModule } from './modules/canchas/canchas.module';
import { HorariosModule } from './modules/horarios/horarios.module';
import { ReservasModule } from './modules/reservas/reservas.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { ExcepcionesModule } from './modules/excepciones/excepciones.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    UsuariosModule,
    CanchasModule,
    HorariosModule,
    ReservasModule,
    PagosModule,
    NotificacionesModule,
    ReportesModule,
    ExcepcionesModule,
  ],
})
export class AppModule {}
