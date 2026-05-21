import {
  ConflictException,
  Injectable,
  NotImplementedException,
  UnauthorizedException,
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

export interface LoginResultado {
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

  async login(input: LoginInput): Promise<LoginResultado> {
    const usuario = await this.usuariosRepository.findByCorreo(input.correo);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const contrasenaValida = await bcrypt.compare(
      input.contrasena,
      usuario.contrasenaHash,
    );
    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const workspaceId = await this.resolverWorkspaceId(usuario);

    const token = await this.jwtService.signAsync({
      sub: usuario.id,
      rol: usuario.rol,
      workspaceId,
    });

    return { token, usuario: this.aPublico(usuario) };
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

  private async resolverWorkspaceId(usuario: Usuario): Promise<string> {
    if (usuario.rol === Rol.ENTRENADOR) {
      const entrenador = await this.entrenadoresRepository.findByUsuarioId(
        usuario.id,
      );
      if (!entrenador) {
        throw new UnauthorizedException(
          'El entrenador no tiene un workspace asociado',
        );
      }
      return entrenador.espacioDeTrabajoId;
    }

    const cliente = await this.clientesRepository.findByUsuarioId(usuario.id);
    if (!cliente) {
      throw new UnauthorizedException(
        'El cliente no tiene un workspace asociado',
      );
    }
    return cliente.espacioDeTrabajoId;
  }

  private aPublico(usuario: Usuario): UsuarioPublico {
    const { contrasenaHash: _, ...resto } = usuario;
    return resto;
  }
}
