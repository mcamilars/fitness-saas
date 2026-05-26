import { slugify } from './slugify';

describe('slugify', () => {
  it('convierte a minúsculas y reemplaza espacios por guiones', () => {
    expect(slugify('Fuerza Total')).toBe('fuerza-total');
  });

  it('elimina diacríticos (tildes y eñes)', () => {
    expect(slugify('Gimnasio Müñoz Áéí')).toBe('gimnasio-munoz-aei');
  });

  it('colapsa caracteres no alfanuméricos consecutivos en un solo guion', () => {
    expect(slugify('Box   &   Crossfit!!!')).toBe('box-crossfit');
  });

  it('recorta guiones al inicio y al final', () => {
    expect(slugify('  ---Hola Mundo---  ')).toBe('hola-mundo');
  });

  it('devuelve cadena vacía cuando no quedan caracteres válidos', () => {
    expect(slugify('### @@@ !!!')).toBe('');
  });

  it('conserva los números', () => {
    expect(slugify('Plan 2026 Avanzado')).toBe('plan-2026-avanzado');
  });
});
