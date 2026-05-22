import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

export interface RespuestaExitosa<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, RespuestaExitosa<T>>
{
  intercept(
    _ctx: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<RespuestaExitosa<T>> {
    return next.handle().pipe(map((data) => ({ data })));
  }
}
