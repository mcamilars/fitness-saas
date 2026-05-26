import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoPlan, TipoPlanEntrenamiento, type EjercicioPlan, type PlanDeEntrenamiento } from '@repo/database';
import { EntrenadoresRepository } from '../../entrenadores/repositories/entrenadores.repository';
import { PlanFactoriesProvider } from '../factories/plan-factory.provider';
import { PlanDeEntrenamientoPrototype } from '../prototypes/plan.prototype';
import {
  type AgregarEjercicioPlanInput,
  type PlanConEjercicios,
  PlanesEntrenamientoRepository,
} from '../repositories/planes-entrenamiento.repository';
import { PlanSubject } from '../observers/plan-subject.service';
import { PlanStateFactory } from '../states/state.factory';

export interface CrearPlanEntrenamientoDto {
  nombre: string;
  descripcion?: string;
  tipo: TipoPlanEntrenamiento;
}

@Injectable()
export class PlanesEntrenamientoService {
  constructor(
    private readonly planesRepository: PlanesEntrenamientoRepository,
    private readonly entrenadoresRepository: EntrenadoresRepository,
    private readonly planFactoriesProvider: PlanFactoriesProvider,
    private readonly planStateFactory: PlanStateFactory,
    private readonly planSubject: PlanSubject,
  ) {}

  crear(
    tipo: TipoPlanEntrenamiento,
    dto: CrearPlanEntrenamientoDto,
    entrenadorId: string,
  ): Promise<PlanDeEntrenamiento> {
    const draft = this.planFactoriesProvider.obtener(tipo).crear({ ...dto, tipo });

    return this.planesRepository.crear({
      nombre: draft.nombre,
      descripcion: draft.descripcion,
      tipo: draft.tipo,
      estado: EstadoPlan.BORRADOR,
      entrenador: { connect: { id: entrenadorId } },
    });
  }

  async crearParaUsuario(
    dto: CrearPlanEntrenamientoDto,
    usuarioId: string,
  ): Promise<PlanDeEntrenamiento> {
    const entrenador = await this.entrenadoresRepository.findByUsuarioId(usuarioId);

    if (!entrenador) {
      throw new NotFoundException('Entrenador no encontrado');
    }

    return this.crear(dto.tipo, dto, entrenador.id);
  }

  findAll(workspaceId: string): Promise<PlanConEjercicios[]> {
    return this.planesRepository.findAllPorWorkspace(workspaceId);
  }

  async findById(id: string, workspaceId: string): Promise<PlanConEjercicios> {
    const plan = await this.planesRepository.findByIdConEjercicios(id);

    if (!plan) {
      throw new NotFoundException('Plan de entrenamiento no encontrado');
    }

    this.validarWorkspace(plan, workspaceId);

    return plan;
  }

  async activar(id: string, workspaceId: string): Promise<PlanConEjercicios> {
    const plan = await this.findById(id, workspaceId);
    const state = this.planStateFactory.fromEstado(plan.estado);

    await state.activar(plan, {
      repository: this.planesRepository,
      subject: this.planSubject,
    });

    return this.findById(id, workspaceId);
  }

  async archivar(id: string, workspaceId: string): Promise<PlanConEjercicios> {
    const plan = await this.findById(id, workspaceId);
    const state = this.planStateFactory.fromEstado(plan.estado);

    await state.archivar(plan, {
      repository: this.planesRepository,
      subject: this.planSubject,
    });

    return this.findById(id, workspaceId);
  }

  async duplicar(id: string, workspaceId: string): Promise<PlanConEjercicios> {
    const plan = await this.findById(id, workspaceId);
    const snapshot = new PlanDeEntrenamientoPrototype(plan).clone();

    return this.planesRepository.crearDesdeClone(snapshot);
  }

  async agregarEjercicio(
    planId: string,
    dto: AgregarEjercicioPlanInput,
    workspaceId: string,
  ): Promise<EjercicioPlan> {
    const plan = await this.findById(planId, workspaceId);
    const ejercicioPlan = await this.planesRepository.agregarEjercicioPlan(
      planId,
      dto,
    );

    if (plan.estado === EstadoPlan.ACTIVO) {
      this.planSubject.notify(plan.id, {
        tipo: 'PLAN_MODIFICADO',
        planId: plan.id,
      });
    }

    return ejercicioPlan;
  }

  async quitarEjercicio(
    planId: string,
    ejercicioPlanId: string,
    workspaceId: string,
  ): Promise<EjercicioPlan> {
    const plan = await this.findById(planId, workspaceId);
    const ejercicioPlan = await this.planesRepository.quitarEjercicioPlan(
      ejercicioPlanId,
    );

    if (plan.estado === EstadoPlan.ACTIVO) {
      this.planSubject.notify(plan.id, {
        tipo: 'PLAN_MODIFICADO',
        planId: plan.id,
      });
    }

    return ejercicioPlan;
  }

  private validarWorkspace(plan: PlanConEjercicios, workspaceId: string): void {
    if (plan.entrenador.espacioDeTrabajoId !== workspaceId) {
      throw new ForbiddenException('El plan no pertenece a este workspace');
    }
  }
}
