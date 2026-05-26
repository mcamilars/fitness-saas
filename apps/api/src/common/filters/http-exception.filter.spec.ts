import {
  type ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let status: jest.Mock;
  let json: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    filter = new HttpExceptionFilter();
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method: 'GET', url: '/api/test' }),
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('normaliza una HttpException con respuesta string', () => {
    filter.catch(
      new HttpException('No encontrado', HttpStatus.NOT_FOUND),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      mensaje: 'No encontrado',
      error: 'HttpException',
    });
  });

  it('normaliza una HttpException con respuesta objeto (mensaje array de validación)', () => {
    const exception = new BadRequestException([
      'correo must be an email',
      'contrasena too short',
    ]);

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      mensaje: ['correo must be an email', 'contrasena too short'],
      error: 'Bad Request',
    });
  });

  it('usa el nombre de la excepción cuando el objeto no trae error', () => {
    const exception = new HttpException(
      { message: 'algo falló' },
      HttpStatus.CONFLICT,
    );

    filter.catch(exception, host);

    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      mensaje: 'algo falló',
      error: 'HttpException',
    });
  });

  it('mapea un Error genérico a 500 conservando el mensaje', () => {
    filter.catch(new Error('boom inesperado'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      mensaje: 'boom inesperado',
      error: 'Error',
    });
  });

  it('usa valores por defecto cuando se lanza algo que no es Error', () => {
    filter.catch('cadena suelta', host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      mensaje: 'Error interno del servidor',
      error: 'InternalServerError',
    });
  });
});
