import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Rol } from '@repo/database';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const construir = (rolesRequeridos: Rol[] | undefined, rolUsuario: Rol) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(rolesRequeridos),
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { rol: rolUsuario } }) }),
      getHandler: () => 'handler',
      getClass: () => 'class',
    } as unknown as ExecutionContext;

    const guard = new RolesGuard(reflector as never);

    return { guard, ctx };
  };

  it('permite el acceso cuando el handler no declara roles', () => {
    const { guard, ctx } = construir(undefined, Rol.CLIENTE);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite el acceso cuando la lista de roles está vacía', () => {
    const { guard, ctx } = construir([], Rol.CLIENTE);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite el acceso cuando el rol del usuario está incluido', () => {
    const { guard, ctx } = construir([Rol.ENTRENADOR], Rol.ENTRENADOR);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('lanza Forbidden cuando el rol del usuario no está incluido', () => {
    const { guard, ctx } = construir([Rol.ENTRENADOR], Rol.CLIENTE);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
