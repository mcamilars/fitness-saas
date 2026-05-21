import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface RespuestaError {
  statusCode: number;
  mensaje: string | string[];
  error: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensaje: string | string[] = 'Error interno del servidor';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const respuesta = exception.getResponse();

      if (typeof respuesta === 'string') {
        mensaje = respuesta;
        error = exception.name;
      } else if (typeof respuesta === 'object' && respuesta !== null) {
        const r = respuesta as { message?: string | string[]; error?: string };
        mensaje = r.message ?? exception.message;
        error = r.error ?? exception.name;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      mensaje = exception.message;
      error = exception.name;
    }

    const body: RespuestaError = { statusCode, mensaje, error };

    response.status(statusCode).json(body);

    if (statusCode >= 500) {
      this.logger.error(`${request.method} ${request.url} → ${statusCode}`);
    }
  }
}
