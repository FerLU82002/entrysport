import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface RespuestaEstandar<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, RespuestaEstandar<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<RespuestaEstandar<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: data?.data !== undefined ? data.data : data,
        message: data?.message || 'Operación exitosa',
      })),
    );
  }
}
