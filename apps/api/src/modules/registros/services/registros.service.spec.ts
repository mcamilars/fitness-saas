import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GrupoMuscular } from '@repo/database';
import type { CrearRegistroEntrenamientoDto } from '../dtos/crear-registro-entrenamiento.dto';
import { RegistrosService } from './registros.service';

describe('RegistrosService', () => {
  const clienteBase = {
    id: 'cliente-1',
    usuarioId: 'usuario-1',
    entrenadorId: 'entrenador-1',
    espacioDeTrabajoId: 'workspace-1',
    estaActivo: true,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    usuario: {
      id: 'usuario-1',
      correo: 'cliente@test.com',
      nombre: 'Cliente',
      apellido: 'Test',
      rol: 'CLIENTE',
      estaActivo: true,
      contrasenaHash: 'hash',
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    },
  };

  const registroCreado = {
    id: 'registro-1',
    clienteId: 'cliente-1',
    fecha: new Date('2026-05-25'),
    notas: 'sesion intensa',
    duracionMin: 60,
    creadoEn: new Date(),
    ejercicios: [],
  };

  const registrosRepository = {
    crearConEjercicios: jest.fn(),
    listarPorCliente: jest.fn(),
  };

  const clientesRepository = {
    findByIdConPerfil: jest.fn(),
  };

  let service: RegistrosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RegistrosService(
      registrosRepository as never,
      clientesRepository as never,
    );
  });

  describe('registrar', () => {
    const dto: CrearRegistroEntrenamientoDto = {
      fecha: '2026-05-25',
      duracionMin: 60,
      notas: 'sesion intensa',
      ejercicios: [
        {
          nombre: 'Press banca',
          grupoMuscular: GrupoMuscular.PECHO,
          series: 4,
          repeticiones: 10,
          pesoKg: 80,
        },
      ],
    };

    it('valida workspace, construye con el builder y persiste el registro', async () => {
      clientesRepository.findByIdConPerfil.mockResolvedValue(clienteBase);
      registrosRepository.crearConEjercicios.mockResolvedValue(registroCreado);

      const result = await service.registrar('cliente-1', 'workspace-1', dto);

      expect(clientesRepository.findByIdConPerfil).toHaveBeenCalledWith('cliente-1', 'workspace-1');
      expect(registrosRepository.crearConEjercicios).toHaveBeenCalledWith(
        expect.objectContaining({
          clienteId: 'cliente-1',
          fecha: new Date('2026-05-25'),
          duracionMin: 60,
          notas: 'sesion intensa',
          ejercicios: expect.arrayContaining([
            expect.objectContaining({
              nombre: 'Press banca',
              grupoMuscular: GrupoMuscular.PECHO,
              series: 4,
              repeticiones: 10,
              pesoKg: 80,
            }),
          ]),
        }),
      );
      expect(result).toEqual(registroCreado);
    });

    it('lanza NotFoundException si el cliente no existe en el workspace', async () => {
      clientesRepository.findByIdConPerfil.mockResolvedValue(null);

      await expect(
        service.registrar('cliente-inexistente', 'workspace-1', dto),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(registrosRepository.crearConEjercicios).not.toHaveBeenCalled();
    });

    it('lanza ForbiddenException si el cliente pertenece a otro workspace', async () => {
      clientesRepository.findByIdConPerfil.mockResolvedValue({
        ...clienteBase,
        espacioDeTrabajoId: 'workspace-otro',
      });

      await expect(
        service.registrar('cliente-1', 'workspace-1', dto),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lanza BadRequest si el DTO no incluye ejercicios (builder)', async () => {
      clientesRepository.findByIdConPerfil.mockResolvedValue(clienteBase);

      const dtoSinEjercicios: CrearRegistroEntrenamientoDto = {
        fecha: '2026-05-25',
        ejercicios: [],
      };

      await expect(
        service.registrar('cliente-1', 'workspace-1', dtoSinEjercicios),
      ).rejects.toThrow('El registro debe tener al menos un ejercicio');
    });

    it('omite campos opcionales cuando no vienen en el DTO', async () => {
      clientesRepository.findByIdConPerfil.mockResolvedValue(clienteBase);
      registrosRepository.crearConEjercicios.mockResolvedValue(registroCreado);

      const dtoMinimo: CrearRegistroEntrenamientoDto = {
        fecha: '2026-05-25',
        ejercicios: [
          {
            nombre: 'Sentadilla',
            grupoMuscular: GrupoMuscular.PIERNAS,
            series: 3,
            repeticiones: 12,
          },
        ],
      };

      await service.registrar('cliente-1', 'workspace-1', dtoMinimo);

      expect(registrosRepository.crearConEjercicios).toHaveBeenCalledWith(
        expect.objectContaining({
          duracionMin: undefined,
          notas: undefined,
        }),
      );
    });
  });

  describe('listar', () => {
    it('delega al repositorio con los filtros recibidos', async () => {
      const resultado = { registros: [], total: 0, page: 1, limit: 10 };
      registrosRepository.listarPorCliente.mockResolvedValue(resultado);

      const filtros = { page: 1, limit: 10 };
      const result = await service.listar('cliente-1', filtros);

      expect(registrosRepository.listarPorCliente).toHaveBeenCalledWith('cliente-1', filtros);
      expect(result).toEqual(resultado);
    });
  });
});
