import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoAsignacion, EstadoPlan, type AsignacionPlanEntrenamiento } from '@repo/database';
import { ClientesRepository } from '../../clientes/repositories/clientes.repository';
import { MailerService } from '../../mailer/mailer.service';
import { NotificacionesRepository } from '../../notificaciones/repositories/notificaciones.repository';
import { ClienteObserver } from '../../planes-entrenamiento/observers/cliente.observer';
import { EmailNotificationObserver } from '../../planes-entrenamiento/observers/email-notification.observer';
import { PlanSubject } from '../../planes-entrenamiento/observers/plan-subject.service';
import { PlanesEntrenamientoRepository } from '../../planes-entrenamiento/repositories/planes-entrenamiento.repository';
import { AsignacionesEntrenamientoRepository } from '../repositories/asignaciones-entrenamiento.repository';

export interface AsignarEntrenamientoInput {
  clienteId: string;
  planEntrenamientoId: string;
}

@Injectable()
export class AsignacionesService {
  constructor(
    private readonly asignacionesRepository: AsignacionesEntrenamientoRepository,
    private readonly planesRepository: PlanesEntrenamientoRepository,
    private readonly clientesRepository: ClientesRepository,
    private readonly notificacionesRepository: NotificacionesRepository,
    private readonly planSubject: PlanSubject,
    private readonly mailer: MailerService,
  ) {}

  async asignarEntrenamiento(
    dto: AsignarEntrenamientoInput,
    workspaceId: string,
  ): Promise<AsignacionPlanEntrenamiento> {
    const cliente = await this.clientesRepository.findByIdConPerfil(
      dto.clienteId,
      workspaceId,
    );

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const plan = await this.planesRepository.findByIdConEjercicios(
      dto.planEntrenamientoId,
    );

    if (!plan) {
      throw new NotFoundException('Plan de entrenamiento no encontrado');
    }

    if (plan.entrenador.espacioDeTrabajoId !== workspaceId) {
      throw new ForbiddenException('El plan no pertenece a este workspace');
    }

    if (cliente.espacioDeTrabajoId !== plan.entrenador.espacioDeTrabajoId) {
      throw new ForbiddenException('Cliente y plan pertenecen a workspaces distintos');
    }

    if (plan.estado !== EstadoPlan.ACTIVO) {
      throw new BadRequestException('Solo se pueden asignar planes activos');
    }

    const asignacion = await this.asignacionesRepository.crear({
      clienteId: dto.clienteId,
      planDeEntrenamientoId: dto.planEntrenamientoId,
      estado: EstadoAsignacion.ACTIVO,
    });

    const clienteObserver = new ClienteObserver(this.notificacionesRepository, cliente.id);
    const emailObserver = new EmailNotificationObserver(this.mailer, cliente.usuario.correo);

    this.planSubject.subscribe(plan.id, clienteObserver);
    this.planSubject.subscribe(plan.id, emailObserver);

    await this.planSubject.notify(plan.id, {
      tipo: 'PLAN_ACTIVADO',
      planId: plan.id,
      clienteId: cliente.id,
    });

    return asignacion;
  }

  async cambiarEstado(
    asignacionId: string,
    estado: EstadoAsignacion,
  ): Promise<AsignacionPlanEntrenamiento> {
    const asignacion =
      await this.asignacionesRepository.findById(asignacionId);
    if (!asignacion) {
      throw new NotFoundException('Asignación no encontrada');
    }

    return this.asignacionesRepository.updateEstado(asignacionId, estado);
  }
}
