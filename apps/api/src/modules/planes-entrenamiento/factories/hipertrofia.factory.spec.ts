import { TipoPlanEntrenamiento } from '@repo/database';
import { HipertrofiaFactory } from './hipertrofia.factory';

describe('HipertrofiaFactory', () => {
  it('crea un draft con defaults de hipertrofia', () => {
    const factory = new HipertrofiaFactory();

    const draft = factory.crear({
      nombre: 'Plan hipertrofia',
      descripcion: 'Volumen muscular',
      tipo: TipoPlanEntrenamiento.HIPERTROFIA,
    });

    expect(draft).toEqual({
      nombre: 'Plan hipertrofia',
      descripcion: 'Volumen muscular',
      tipo: TipoPlanEntrenamiento.HIPERTROFIA,
      ejercicioDefaults: {
        series: 4,
        repeticiones: 10,
        segundosDeDescanso: 60,
      },
    });
  });
});
