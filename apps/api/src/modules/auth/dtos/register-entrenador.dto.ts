import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterEntrenadorDto {
  @IsEmail()
  correo!: string;

  @IsString()
  @MinLength(8)
  contrasena!: string;

  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsString()
  @MinLength(1)
  apellido!: string;

  @IsString()
  @MinLength(2)
  nombreWorkspace!: string;
}
