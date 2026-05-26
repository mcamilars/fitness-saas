import { GrupoMuscular, type Ejercicio } from '@repo/database';
import { CacheEjerciciosDecorator } from './cache-ejercicios.decorator';
import type { EjerciciosServiceInterface } from '../interfaces/ejercicios-service.interface';

describe('CacheEjerciciosDecorator', () => {
  let impl: jest.Mocked<EjerciciosServiceInterface>;
  let decorator: CacheEjerciciosDecorator;

  beforeEach(() => {
    impl = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByGrupo: jest.fn(),
      create: jest.fn(),
    };

    decorator = new CacheEjerciciosDecorator(impl);
  });

  it('dos llamadas a findAll invocan al impl una sola vez', async () => {
    const ejercicios: Ejercicio[] = [
      crearEjercicio({ id: '1', nombre: 'Press banca', grupoMuscular: GrupoMuscular.PECHO }),
    ];

    impl.findAll.mockResolvedValue(ejercicios);

    const primera = await decorator.findAll();
    const segunda = await decorator.findAll();

    expect(impl.findAll).toHaveBeenCalledTimes(1);
    expect(primera).toEqual(ejercicios);
    expect(segunda).toEqual(ejercicios);
  });

  it('create invalida el cache', async () => {
    impl.findAll.mockResolvedValue([]);
    impl.create.mockResolvedValue(
      crearEjercicio({ id: '2', nombre: 'Press banca', grupoMuscular: GrupoMuscular.PECHO }),
    );

    await decorator.findAll();
    expect(impl.findAll).toHaveBeenCalledTimes(1);

    await decorator.create({
      nombre: 'Press banca',
      grupoMuscular: GrupoMuscular.PECHO,
    });

    await decorator.findAll();
    expect(impl.findAll).toHaveBeenCalledTimes(2);
  });
});

function crearEjercicio(
  overrides: Pick<Ejercicio, 'id' | 'nombre' | 'grupoMuscular'>,
): Ejercicio {
  return {
    id: overrides.id,
    nombre: overrides.nombre,
    grupoMuscular: overrides.grupoMuscular,
    descripcion: null,
    instrucciones: null,
    imagenUrl: null,
    videoUrl: null,
    creadoEn: new Date('2026-01-01T00:00:00.000Z'),
    actualizadoEn: new Date('2026-01-01T00:00:00.000Z'),
  };
}
