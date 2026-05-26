import { TipoPlanEntrenamiento } from '@repo/database';
import { FuerzaFactory } from './fuerza.factory';

describe('FuerzaFactory', () => {
  it('crea un draft con defaults de fuerza', () => {
    const factory = new FuerzaFactory();

    const draft = factory.crear({
      nombre: 'Plan fuerza',
      tipo: TipoPlanEntrenamiento.FUERZA,
    });

    expect(draft).toEqual({
      nombre: 'Plan fuerza',
      descripcion: undefined,
      tipo: TipoPlanEntrenamiento.FUERZA,
      ejercicioDefaults: {
        series: 5,
        repeticiones: 5,
        segundosDeDescanso: 180,
      },
    });
  });
});
