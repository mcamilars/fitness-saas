import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'entrenador@email.com', description: 'Correo electrónico registrado' })
  @IsEmail()
  correo!: string;

  @ApiProperty({ example: 'secreto123', minLength: 8, description: 'Contraseña (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8)
  contrasena!: string;
}
