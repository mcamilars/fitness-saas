import { Injectable, NotImplementedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientesRepository } from '../clientes/repositories/clientes.repository';
import { EntrenadoresRepository } from '../entrenadores/repositories/entrenadores.repository';
import { EspaciosDeTrabajoRepository } from '../espacios-de-trabajo/repositories/espacios-de-trabajo.repository';
import { InvitacionesRepository } from '../invitaciones/repositories/invitaciones.repository';
import { UsuariosRepository } from '../usuarios/repositories/usuarios.repository';

export interface RegistrarEntrenadorInput {
  correo: string;
  contrasena: string;
  nombre: string;
  apellido: string;
  nombreWorkspace: string;
}

export interface LoginInput {
  correo: string;
  contrasena: string;
}

export interface RegistrarClienteInput {
  tokenInvitacion: string;
  correo: string;
  contrasena: string;
  nombre: string;
  apellido: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosRepository: UsuariosRepository,
    private readonly entrenadoresRepository: EntrenadoresRepository,
    private readonly espaciosDeTrabajoRepository: EspaciosDeTrabajoRepository,
    private readonly clientesRepository: ClientesRepository,
    private readonly invitacionesRepository: InvitacionesRepository,
    private readonly jwtService: JwtService,
  ) {}

  registrarEntrenador(_input: RegistrarEntrenadorInput): Promise<unknown> {
    throw new NotImplementedException('Pendiente B1.5');
  }

  login(_input: LoginInput): Promise<unknown> {
    throw new NotImplementedException('Pendiente B1.6');
  }

  registrarCliente(_input: RegistrarClienteInput): Promise<unknown> {
    throw new NotImplementedException('Pendiente B1.7');
  }
}
