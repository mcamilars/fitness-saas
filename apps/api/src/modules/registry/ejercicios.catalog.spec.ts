import { GrupoMuscular, type Ejercicio } from '@repo/database';
import { EjerciciosCatalog } from './ejercicios.catalog';

describe('EjerciciosCatalog', () => {
  it('getInstance retorna la misma referencia', () => {
    const primeraInstancia = EjerciciosCatalog.getInstance();
    const segundaInstancia = EjerciciosCatalog.getInstance();

    expect(primeraInstancia).toBe(segundaInstancia);
  });

  it('cargarDesde puebla el mapa interno', async () => {
    const catalog = EjerciciosCatalog.getInstance();
    const ejercicio = crearEjercicio({
      id: 'ejercicio-test-b2-5',
      nombre: 'Press banca',
      grupoMuscular: GrupoMuscular.PECHO,
    });

    await catalog.cargarDesde({
      findAll: () => Promise.resolve([ejercicio]),
    });

    expect(catalog.obtenerTodos()).toEqual([ejercicio]);
    expect(catalog.buscarPorGrupo(GrupoMuscular.PECHO)).toEqual([ejercicio]);
    expect(catalog.buscarPorGrupo(GrupoMuscular.ESPALDA)).toEqual([]);
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
