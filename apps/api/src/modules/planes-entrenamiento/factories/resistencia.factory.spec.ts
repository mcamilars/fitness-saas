import { TipoPlanEntrenamiento } from '@repo/database';
import { ResistenciaFactory } from './resistencia.factory';

describe('ResistenciaFactory', () => {
  it('crea un draft con defaults de resistencia', () => {
    const factory = new ResistenciaFactory();

    const draft = factory.crear({
      nombre: 'Plan resistencia',
      tipo: TipoPlanEntrenamiento.RESISTENCIA,
    });

    expect(draft).toEqual({
      nombre: 'Plan resistencia',
      descripcion: undefined,
      tipo: TipoPlanEntrenamiento.RESISTENCIA,
      ejercicioDefaults: {
        series: 3,
        repeticiones: 15,
        segundosDeDescanso: 30,
      },
    });
  });
});
