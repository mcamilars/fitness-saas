import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Verificar estado del servidor', description: 'Endpoint público sin autenticación.' })
  @ApiResponse({ status: 200, description: 'Servidor funcionando', schema: { example: { data: { ok: true } } } })
  check(): { ok: true } {
    return { ok: true };
  }
}
