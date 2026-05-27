import { EstadoPlan } from '@repo/database';
import type { Command } from '../../../commands/command.interface';
import type { PlanConEjercicios } from '../repositories/planes-entrenamiento.repository';
import type { PlanesEntrenamientoService } from '../services/planes-entrenamiento.service';

export class ArchivarPlanCommand implements Command<PlanConEjercicios> {
  private estadoPrevio?: EstadoPlan;

  constructor(
    private readonly planesService: PlanesEntrenamientoService,
    private readonly planId: string,
    private readonly workspaceId: string,
  ) {}

  async execute(): Promise<PlanConEjercicios> {
    const plan = await this.planesService.findById(this.planId, this.workspaceId);

    this.estadoPrevio = plan.estado;

    return this.planesService.archivar(this.planId, this.workspaceId);
  }

  async undo(): Promise<void> {
    if (this.estadoPrevio !== EstadoPlan.ACTIVO) {
      return;
    }

    await this.planesService.restaurarEstadoDesdeCommand(
      this.planId,
      this.workspaceId,
      this.estadoPrevio,
    );
  }

  descripcion(): string {
    return `Archivar plan ${this.planId} del workspace ${this.workspaceId}`;
  }
}
