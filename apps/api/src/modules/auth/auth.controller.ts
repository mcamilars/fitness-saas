import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  AuthService,
  type LoginResultado,
  type RegistroClienteResultado,
  type RegistroEntrenadorResultado,
} from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterEntrenadorDto } from './dtos/register-entrenador.dto';
import { RegistrarClienteDto } from './dtos/registrar-cliente.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  registrarEntrenador(
    @Body() dto: RegisterEntrenadorDto,
  ): Promise<RegistroEntrenadorResultado> {
    return this.authService.registrarEntrenador(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<LoginResultado> {
    return this.authService.login(dto);
  }

  @Post('cliente/register')
  @HttpCode(HttpStatus.CREATED)
  registrarCliente(
    @Body() dto: RegistrarClienteDto,
  ): Promise<RegistroClienteResultado> {
    return this.authService.registrarCliente(dto);
  }
}
