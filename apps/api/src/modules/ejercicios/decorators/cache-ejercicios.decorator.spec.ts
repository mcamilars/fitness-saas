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

  it('dos llamadas a findById invocan al impl una sola vez', async () => {
    const ejercicio = crearEjercicio({
      id: '1',
      nombre: 'Press banca',
      grupoMuscular: GrupoMuscular.PECHO,
    });
    impl.findById.mockResolvedValue(ejercicio);

    const primera = await decorator.findById('1');
    const segunda = await decorator.findById('1');

    expect(impl.findById).toHaveBeenCalledTimes(1);
    expect(primera).toEqual(ejercicio);
    expect(segunda).toEqual(ejercicio);
  });

  it('findById no cachea un resultado null', async () => {
    impl.findById.mockResolvedValue(null);

    await decorator.findById('inexistente');
    await decorator.findById('inexistente');

    expect(impl.findById).toHaveBeenCalledTimes(2);
  });

  it('dos llamadas a findByGrupo invocan al impl una sola vez por grupo', async () => {
    const pecho = [
      crearEjercicio({ id: '1', nombre: 'Press banca', grupoMuscular: GrupoMuscular.PECHO }),
    ];
    const espalda = [
      crearEjercicio({ id: '2', nombre: 'Dominadas', grupoMuscular: GrupoMuscular.ESPALDA }),
    ];
    impl.findByGrupo
      .mockResolvedValueOnce(pecho)
      .mockResolvedValueOnce(espalda);

    await decorator.findByGrupo(GrupoMuscular.PECHO);
    await decorator.findByGrupo(GrupoMuscular.PECHO);
    await decorator.findByGrupo(GrupoMuscular.ESPALDA);

    expect(impl.findByGrupo).toHaveBeenCalledTimes(2);
    expect(impl.findByGrupo).toHaveBeenNthCalledWith(1, GrupoMuscular.PECHO);
    expect(impl.findByGrupo).toHaveBeenNthCalledWith(2, GrupoMuscular.ESPALDA);
  });

  it('invalidate borra una clave puntual sin afectar las demás', async () => {
    impl.findAll.mockResolvedValue([]);
    impl.findById.mockResolvedValue(
      crearEjercicio({ id: '1', nombre: 'Press banca', grupoMuscular: GrupoMuscular.PECHO }),
    );

    await decorator.findAll();
    await decorator.findById('1');

    decorator.invalidate('id:1');

    await decorator.findAll();
    await decorator.findById('1');

    expect(impl.findAll).toHaveBeenCalledTimes(1);
    expect(impl.findById).toHaveBeenCalledTimes(2);
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
