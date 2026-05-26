import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseEnumPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GrupoMuscular } from '@repo/database';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CrearEjercicioDto } from '../dtos/crear-ejercicio.dto';
import type { EjerciciosServiceInterface } from '../interfaces/ejercicios-service.interface';

@ApiTags('Ejercicios')
@ApiBearerAuth('JWT')
@Controller('ejercicios')
@UseGuards(JwtAuthGuard)
export class EjerciciosController {
  constructor(
    @Inject('EJERCICIOS_SERVICE')
    private readonly ejerciciosService: EjerciciosServiceInterface,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los ejercicios', description: 'Devuelve el catálogo completo de ejercicios (servido desde caché en memoria).' })
  @ApiResponse({
    status: 200,
    description: 'Lista de ejercicios',
    schema: {
      example: {
        data: [
          { id: 'uuid', nombre: 'Press de banca', grupoMuscular: 'PECHO', descripcion: null, instrucciones: null, imagenUrl: null, videoUrl: null },
        ],
      },
    },
  })
  findAll() {
    return this.ejerciciosService.findAll();
  }

  @Get('por-grupo/:grupoMuscular')
  @ApiOperation({ summary: 'Filtrar ejercicios por grupo muscular' })
  @ApiParam({ name: 'grupoMuscular', enum: GrupoMuscular, example: GrupoMuscular.PECHO })
  @ApiResponse({
    status: 200,
    description: 'Ejercicios del grupo muscular indicado',
    schema: { example: { data: [{ id: 'uuid', nombre: 'Press de banca', grupoMuscular: 'PECHO' }] } },
  })
  @ApiResponse({ status: 400, description: 'Grupo muscular no válido' })
  findByGrupo(
    @Param('grupoMuscular', new ParseEnumPipe(GrupoMuscular))
    grupo: GrupoMuscular,
  ) {
    return this.ejerciciosService.findByGrupo(grupo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un ejercicio por ID' })
  @ApiParam({ name: 'id', description: 'UUID del ejercicio' })
  @ApiResponse({
    status: 200,
    description: 'Ejercicio encontrado',
    schema: { example: { data: { id: 'uuid', nombre: 'Press de banca', grupoMuscular: 'PECHO', descripcion: null } } },
  })
  @ApiResponse({ status: 404, description: 'Ejercicio no encontrado' })
  findById(@Param('id') id: string) {
    return this.ejerciciosService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ENTRENADOR')
  @ApiOperation({ summary: 'Crear un ejercicio', description: 'Solo accesible para entrenadores. Invalida el caché automáticamente.' })
  @ApiResponse({
    status: 201,
    description: 'Ejercicio creado',
    schema: { example: { data: { id: 'uuid', nombre: 'Press de banca', grupoMuscular: 'PECHO', descripcion: null } } },
  })
  @ApiResponse({ status: 403, description: 'Solo entrenadores pueden crear ejercicios' })
  create(@Body() dto: CrearEjercicioDto) {
    return this.ejerciciosService.create(dto);
  }
}
