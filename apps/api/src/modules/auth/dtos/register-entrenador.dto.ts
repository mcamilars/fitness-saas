import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterEntrenadorDto {
  @ApiProperty({ example: 'juan@gym.com', description: 'Correo del entrenador' })
  @IsEmail()
  correo!: string;

  @ApiProperty({ example: 'secreto123', minLength: 8 })
  @IsString()
  @MinLength(8)
  contrasena!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(1)
  nombre!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(1)
  apellido!: string;

  @ApiProperty({ example: 'Gym Elite', minLength: 2, description: 'Nombre del espacio de trabajo que se creará' })
  @IsString()
  @MinLength(2)
  nombreWorkspace!: string;
}
