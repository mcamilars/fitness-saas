import {
  ConflictException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Rol, type Usuario } from '@repo/database';
import * as bcrypt from 'bcryptjs';
import { slugify } from '../../common/utils/slugify';
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

export type UsuarioPublico = Omit<Usuario, 'contrasenaHash'>;

export interface RegistroEntrenadorResultado {
  token: string;
  usuario: UsuarioPublico;
}

const BCRYPT_ROUNDS = 10;

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

  async registrarEntrenador(
    input: RegistrarEntrenadorInput,
  ): Promise<RegistroEntrenadorResultado> {
    const correoExistente = await this.usuariosRepository.findByCorreo(input.correo);
    if (correoExistente) {
      throw new ConflictException('El correo ya está registrado');
    }

    const slug = await this.generarSlugUnico(input.nombreWorkspace);
    const contrasenaHash = await bcrypt.hash(input.contrasena, BCRYPT_ROUNDS);

    const { usuario, workspaceId } = await this.usuariosRepository.conTransaccion(
      async (tx) => {
        const nuevoUsuario = await this.usuariosRepository.crear(
          {
            correo: input.correo,
            contrasenaHash,
            nombre: input.nombre,
            apellido: input.apellido,
            rol: Rol.ENTRENADOR,
          },
          tx,
        );

        const workspace = await this.espaciosDeTrabajoRepository.crear(
          {
            nombre: input.nombreWorkspace,
            slug,
          },
          tx,
        );

        await this.entrenadoresRepository.crear(
          {
            usuario: { connect: { id: nuevoUsuario.id } },
            espacioDeTrabajo: { connect: { id: workspace.id } },
          },
          tx,
        );

        return { usuario: nuevoUsuario, workspaceId: workspace.id };
      },
    );

    const token = await this.jwtService.signAsync({
      sub: usuario.id,
      rol: usuario.rol,
      workspaceId,
    });

    return { token, usuario: this.aPublico(usuario) };
  }

  login(_input: LoginInput): Promise<unknown> {
    throw new NotImplementedException('Pendiente B1.6');
  }

  registrarCliente(_input: RegistrarClienteInput): Promise<unknown> {
    throw new NotImplementedException('Pendiente B1.7');
  }

  private async generarSlugUnico(nombre: string): Promise<string> {
    const base = slugify(nombre);
    if (!base) {
      throw new ConflictException('Nombre de workspace inválido para generar slug');
    }

    let candidato = base;
    let sufijo = 1;
    while (await this.espaciosDeTrabajoRepository.findBySlug(candidato)) {
      sufijo += 1;
      candidato = `${base}-${sufijo}`;
    }
    return candidato;
  }

  private aPublico(usuario: Usuario): UsuarioPublico {
    const { contrasenaHash: _, ...resto } = usuario;
    return resto;
  }
}
