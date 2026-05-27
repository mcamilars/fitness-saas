import { ConflictException, Injectable } from '@nestjs/common';
import { EstadoPlan, type EjercicioPlan, type PlanDeEntrenamiento, Prisma, PrismaService } from '@repo/database';

export type PlanConEjercicios = Prisma.PlanDeEntrenamientoGetPayload<{
  include: {
    entrenador: true;
    ejercicioPlanes: {
      include: { ejercicio: true };
      orderBy: { orden: 'asc' };
    };
  };
}>;

export type CrearPlanEntrenamientoInput = Prisma.PlanDeEntrenamientoCreateInput;

export type AgregarEjercicioPlanInput = Omit<
  Prisma.EjercicioPlanUncheckedCreateInput,
  'id' | 'planDeEntrenamientoId'
>;

export type PlanCloneSnapshot = Omit<
  Prisma.PlanDeEntrenamientoUncheckedCreateInput,
  'id' | 'creadoEn' | 'actualizadoEn'
> & {
  ejercicioPlanes?: Omit<
    Prisma.EjercicioPlanUncheckedCreateInput,
    'id' | 'planDeEntrenamientoId'
  >[];
};

export interface PlanesEntrenamientoRepositoryInterface {
  crear(
    plan: CrearPlanEntrenamientoInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PlanDeEntrenamiento>;
  findAllPorWorkspace(workspaceId: string): Promise<PlanConEjercicios[]>;
  findByIdConEjercicios(id: string): Promise<PlanConEjercicios | null>;
  updateEstado(
    id: string,
    estado: EstadoPlan,
    tx?: Prisma.TransactionClient,
  ): Promise<PlanDeEntrenamiento>;
  agregarEjercicioPlan(
    planId: string,
    dto: AgregarEjercicioPlanInput,
    tx?: Prisma.TransactionClient,
  ): Promise<EjercicioPlan>;
  quitarEjercicioPlan(
    ejercicioPlanId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<EjercicioPlan>;
  contarEjercicios(planId: string): Promise<number>;
  crearDesdeClone(
    snapshot: PlanCloneSnapshot,
    tx?: Prisma.TransactionClient,
  ): Promise<PlanConEjercicios>;
}

@Injectable()
export class PlanesEntrenamientoRepository
  implements PlanesEntrenamientoRepositoryInterface
{
  constructor(private readonly prisma: PrismaService) {}

  crear(
    plan: CrearPlanEntrenamientoInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PlanDeEntrenamiento> {
    const client = tx ?? this.prisma;
    return client.planDeEntrenamiento.create({ data: plan });
  }

  findAllPorWorkspace(workspaceId: string): Promise<PlanConEjercicios[]> {
    return this.prisma.planDeEntrenamiento.findMany({
      where: { entrenador: { espacioDeTrabajoId: workspaceId } },
      include: this.includeConEjercicios(),
      orderBy: { creadoEn: 'desc' },
    });
  }

  findByIdConEjercicios(id: string): Promise<PlanConEjercicios | null> {
    return this.prisma.planDeEntrenamiento.findUnique({
      where: { id },
      include: this.includeConEjercicios(),
    });
  }

  updateEstado(
    id: string,
    estado: EstadoPlan,
    tx?: Prisma.TransactionClient,
  ): Promise<PlanDeEntrenamiento> {
    const client = tx ?? this.prisma;
    return client.planDeEntrenamiento.update({
      where: { id },
      data: { estado },
    });
  }

  async agregarEjercicioPlan(
    planId: string,
    dto: AgregarEjercicioPlanInput,
    tx?: Prisma.TransactionClient,
  ): Promise<EjercicioPlan> {
    const client = tx ?? this.prisma;

    try {
      return await client.ejercicioPlan.create({
        data: { ...dto, planDeEntrenamientoId: planId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Este ejercicio ya está incluido en el plan. Elige otro ejercicio o elimina el existente antes de agregarlo nuevamente.',
        );
      }

      throw error;
    }
  }

  quitarEjercicioPlan(
    ejercicioPlanId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<EjercicioPlan> {
    const client = tx ?? this.prisma;
    return client.ejercicioPlan.delete({ where: { id: ejercicioPlanId } });
  }

  contarEjercicios(planId: string): Promise<number> {
    return this.prisma.ejercicioPlan.count({
      where: { planDeEntrenamientoId: planId },
    });
  }

  crearDesdeClone(
    snapshot: PlanCloneSnapshot,
    tx?: Prisma.TransactionClient,
  ): Promise<PlanConEjercicios> {
    const client = tx ?? this.prisma;
    const { ejercicioPlanes = [], ...plan } = snapshot;

    return client.planDeEntrenamiento.create({
      data: {
        ...plan,
        ejercicioPlanes: {
          create: ejercicioPlanes.map((ejercicioPlan) => ({ ...ejercicioPlan })),
        },
      },
      include: this.includeConEjercicios(),
    });
  }

  private includeConEjercicios() {
    return {
      entrenador: true,
      ejercicioPlanes: {
        include: { ejercicio: true },
        orderBy: { orden: 'asc' as const },
      },
    };
  }
}
