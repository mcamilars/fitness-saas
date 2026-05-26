import { BadRequestException } from '@nestjs/common';
import { GrupoMuscular } from '@repo/database';
import { RegistroEntrenamientoBuilder } from './registro-entrenamiento.builder';

describe('RegistroEntrenamientoBuilder', () => {
  it('build sin ejercicios falla', () => {
    const builder = new RegistroEntrenamientoBuilder()
      .setFecha(new Date('2026-01-01T00:00:00.000Z'))
      .setClienteId('cliente-1');

    expect(() => builder.build()).toThrow(BadRequestException);
  });

  it('build con ejercicios construye objeto correcto', () => {
    const fecha = new Date('2026-01-01T00:00:00.000Z');
    const builder = new RegistroEntrenamientoBuilder()
      .setFecha(fecha)
      .setClienteId('cliente-1')
      .setNotas('Buen entrenamiento')
      .setDuracionMin(45)
      .addEjercicio({
        ejercicioId: 'ejercicio-1',
        nombre: 'Press banca',
        grupoMuscular: GrupoMuscular.PECHO,
        series: 4,
        repeticiones: 10,
        pesoKg: 80,
        notas: 'Controlado',
      });

    const registro = builder.build();

    expect(registro).toEqual({
      fecha,
      clienteId: 'cliente-1',
      ejercicios: [
        {
          ejercicioId: 'ejercicio-1',
          nombre: 'Press banca',
          grupoMuscular: GrupoMuscular.PECHO,
          series: 4,
          repeticiones: 10,
          pesoKg: 80,
          notas: 'Controlado',
        },
      ],
      notas: 'Buen entrenamiento',
      duracionMin: 45,
    });
    expect(Object.isFrozen(registro)).toBe(true);
  });

  it('build devuelve copia defensiva de ejercicios', () => {
    const ejercicio = {
      nombre: 'Sentadilla',
      grupoMuscular: GrupoMuscular.PIERNAS,
      series: 3,
      repeticiones: 8,
    };
    const builder = new RegistroEntrenamientoBuilder()
      .setFecha(new Date('2026-01-01T00:00:00.000Z'))
      .setClienteId('cliente-1')
      .addEjercicio(ejercicio);

    ejercicio.series = 99;

    expect(builder.build().ejercicios[0]?.series).toBe(3);
  });
});
