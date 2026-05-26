import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AuthService,
  type LoginResultado,
  type RegistroClienteResultado,
  type RegistroEntrenadorResultado,
} from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterEntrenadorDto } from './dtos/register-entrenador.dto';
import { RegistrarClienteDto } from './dtos/registrar-cliente.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo entrenador', description: 'Crea un usuario con rol ENTRENADOR y su espacio de trabajo. Devuelve un JWT listo para usar.' })
  @ApiBody({ type: RegisterEntrenadorDto })
  @ApiResponse({
    status: 201,
    description: 'Entrenador registrado correctamente',
    schema: {
      example: {
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          usuario: { id: 'uuid', correo: 'juan@gym.com', nombre: 'Juan', apellido: 'Pérez', rol: 'ENTRENADOR', workspaceId: 'uuid', creadoEn: '2026-05-26T00:00:00.000Z' },
        },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'El correo ya está registrado', schema: { example: { statusCode: 409, mensaje: 'El correo ya está en uso', error: 'ConflictException' } } })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos', schema: { example: { statusCode: 400, mensaje: ['correo must be an email'], error: 'Bad Request' } } })
  registrarEntrenador(
    @Body() dto: RegisterEntrenadorDto,
  ): Promise<RegistroEntrenadorResultado> {
    return this.authService.registrarEntrenador(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión', description: 'Autentica un usuario (entrenador o cliente) y devuelve un JWT.' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      example: {
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          usuario: { id: 'uuid', correo: 'juan@gym.com', nombre: 'Juan', apellido: 'Pérez', rol: 'ENTRENADOR', workspaceId: 'uuid' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas', schema: { example: { statusCode: 401, mensaje: 'Credenciales incorrectas', error: 'UnauthorizedException' } } })
  login(@Body() dto: LoginDto): Promise<LoginResultado> {
    return this.authService.login(dto);
  }

  @Post('cliente/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un cliente via invitación', description: 'Completa el registro de un cliente usando el token recibido por correo. El token debe ser válido y no consumido.' })
  @ApiBody({ type: RegistrarClienteDto })
  @ApiResponse({
    status: 201,
    description: 'Cliente registrado correctamente',
    schema: {
      example: {
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          cliente: { id: 'uuid', usuarioId: 'uuid', espacioDeTrabajoId: 'uuid', estaActivo: true, creadoEn: '2026-05-26T00:00:00.000Z' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado', schema: { example: { statusCode: 400, mensaje: 'Token de invitación inválido o expirado', error: 'BadRequestException' } } })
  registrarCliente(
    @Body() dto: RegistrarClienteDto,
  ): Promise<RegistroClienteResultado> {
    return this.authService.registrarCliente(dto);
  }
}
