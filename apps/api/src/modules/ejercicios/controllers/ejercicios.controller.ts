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
import { GrupoMuscular } from '@repo/database';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import type { CrearEjercicioDto } from '../dtos/crear-ejercicio.dto';
import type { EjerciciosServiceInterface } from '../interfaces/ejercicios-service.interface';

@Controller('ejercicios')
@UseGuards(JwtAuthGuard)
export class EjerciciosController {
  constructor(
    @Inject('EJERCICIOS_SERVICE')
    private readonly ejerciciosService: EjerciciosServiceInterface,
  ) {}

  @Get()
  findAll() {
    return this.ejerciciosService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.ejerciciosService.findById(id);
  }

  @Get('por-grupo/:grupoMuscular')
  findByGrupo(
    @Param('grupoMuscular', new ParseEnumPipe(GrupoMuscular))
    grupo: GrupoMuscular,
  ) {
    return this.ejerciciosService.findByGrupo(grupo);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ENTRENADOR')
  create(@Body() dto: CrearEjercicioDto) {
    return this.ejerciciosService.create(dto);
  }
}
