import { Test } from '@nestjs/testing';
import { GrupoMuscular, PrismaService } from '@repo/database';
import { EjerciciosRepository } from './ejercicios.repository';

describe('EjerciciosRepository', () => {
  let repository: EjerciciosRepository;
  const prisma = {
    ejercicio: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EjerciciosRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = moduleRef.get(EjerciciosRepository);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findAll llama a prisma.ejercicio.findMany', async () => {
    const ejercicios = [{ id: '1', nombre: 'Press banca' }];
    prisma.ejercicio.findMany.mockResolvedValue(ejercicios);

    const result = await repository.findAll();

    expect(prisma.ejercicio.findMany).toHaveBeenCalledWith({
      orderBy: { nombre: 'asc' },
    });
    expect(result).toEqual(ejercicios);
  });

  it('findById llama a prisma.ejercicio.findUnique', async () => {
    const ejercicio = { id: '1', nombre: 'Press banca' };
    prisma.ejercicio.findUnique.mockResolvedValue(ejercicio);

    const result = await repository.findById('1');

    expect(prisma.ejercicio.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(result).toEqual(ejercicio);
  });

  it('findByGrupo llama a prisma.ejercicio.findMany con filtro', async () => {
    const ejercicios = [{ id: '1', nombre: 'Press banca', grupoMuscular: GrupoMuscular.PECHO }];
    prisma.ejercicio.findMany.mockResolvedValue(ejercicios);

    const result = await repository.findByGrupo(GrupoMuscular.PECHO);

    expect(prisma.ejercicio.findMany).toHaveBeenCalledWith({
      where: { grupoMuscular: GrupoMuscular.PECHO },
      orderBy: { nombre: 'asc' },
    });
    expect(result).toEqual(ejercicios);
  });

  it('crear llama a prisma.ejercicio.create', async () => {
    const dto = {
      nombre: 'Press banca',
      grupoMuscular: GrupoMuscular.PECHO,
      descripcion: null,
      instrucciones: null,
      imagenUrl: null,
      videoUrl: null,
    };
    const ejercicio = { id: '1', ...dto };
    prisma.ejercicio.create.mockResolvedValue(ejercicio);

    const result = await repository.crear(dto);

    expect(prisma.ejercicio.create).toHaveBeenCalledWith({
      data: dto,
    });
    expect(result).toEqual(ejercicio);
  });
});
