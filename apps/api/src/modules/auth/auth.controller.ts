import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  AuthService,
  type RegistroEntrenadorResultado,
} from './auth.service';
import { RegisterEntrenadorDto } from './dtos/register-entrenador.dto';

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
}
