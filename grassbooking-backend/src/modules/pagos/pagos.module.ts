import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosController } from './pagos.controller';
import { MercadoPagoOAuthController } from './mercadopago-oauth.controller';
import { PagosService } from './pagos.service';
import { PagosGatewayService } from './pagos-gateway.service';
import { PagosSplitService } from './pagos-split.service';
import { MercadoPagoOAuthService } from './mercadopago-oauth.service';
import { MercadoPagoWebhookService } from './mercadopago-webhook.service';
import { Pago } from './entities/pago.entity';
import { CuentaMercadoPago } from './entities/cuenta-mercadopago.entity';
import { OauthState } from './entities/oauth-state.entity';
import { WebhookEventoPago } from './entities/webhook-evento-pago.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Notificacion } from '../notificaciones/entities/notificacion.entity';
import { LocalesModule } from '../locales/locales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pago,
      CuentaMercadoPago,
      OauthState,
      WebhookEventoPago,
      Reserva,
      Notificacion,
    ]),
    LocalesModule,
  ],
  controllers: [PagosController, MercadoPagoOAuthController],
  providers: [
    PagosService,
    PagosGatewayService,
    PagosSplitService,
    MercadoPagoOAuthService,
    MercadoPagoWebhookService,
  ],
  exports: [PagosService],
})
export class PagosModule {}
