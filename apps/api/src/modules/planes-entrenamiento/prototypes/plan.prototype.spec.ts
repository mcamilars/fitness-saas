import { EstadoPlan, TipoPlanEntrenamiento } from '@repo/database';
import { PlanDeEntrenamientoPrototype } from './plan.prototype';

describe('PlanDeEntrenamientoPrototype', () => {
  it('clone genera nuevo objeto con ids vacíos y sufijo (copia)', () => {
    const original = {
      id: 'plan-1',
      entrenadorId: 'entrenador-1',
      nombre: 'Plan fuerza',
      descripcion: 'Descripción original',
      tipo: TipoPlanEntrenamiento.FUERZA,
      estado: EstadoPlan.ACTIVO,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
      ejercicioPlanes: [
        {
          id: 'ejercicio-plan-1',
          planDeEntrenamientoId: 'plan-1',
          ejercicioId: 'ejercicio-1',
          series: 5,
          repeticiones: 5,
          segundosDeDescanso: 180,
          notas: 'Pesado',
          orden: 1,
        },
      ],
    };

    const clone = new PlanDeEntrenamientoPrototype(original).clone();

    expect(clone).toEqual({
      entrenadorId: 'entrenador-1',
      nombre: 'Plan fuerza (copia)',
      descripcion: 'Descripción original',
      tipo: TipoPlanEntrenamiento.FUERZA,
      estado: EstadoPlan.BORRADOR,
      ejercicioPlanes: [
        {
          ejercicioId: 'ejercicio-1',
          series: 5,
          repeticiones: 5,
          segundosDeDescanso: 180,
          notas: 'Pesado',
          orden: 1,
        },
      ],
    });
    expect(clone).not.toHaveProperty('id');
    expect(clone.ejercicioPlanes?.[0]).not.toHaveProperty('id');
    expect(clone.ejercicioPlanes?.[0]).not.toHaveProperty(
      'planDeEntrenamientoId',
    );
  });
});
