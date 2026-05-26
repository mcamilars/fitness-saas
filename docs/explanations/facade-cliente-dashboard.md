# Patrón Facade — ClienteDashboardFacade

El patrón **Facade** proporciona una interfaz simplificada que oculta la complejidad de un subsistema formado por múltiples piezas.

En este backend, mostrar el dashboard de un cliente requiere consultar cuatro fuentes distintas: el perfil del cliente, el plan activo del workspace, los últimos registros de entrenamiento y el resumen de progreso semanal. Sin una facade, el controller tendría que conocer y coordinar cuatro servicios. Con la facade, el controller hace una sola llamada y recibe todo compuesto.

## Partes implementadas

### 1. `ClienteDashboardFacade`

Archivo:

```txt
apps/api/src/modules/dashboard/cliente-dashboard.facade.ts
```

Es el núcleo del patrón. Inyecta los cuatro servicios del subsistema y los coordina en un único método:

```ts
@Injectable()
export class ClienteDashboardFacade {
  constructor(
    private readonly clientesService: ClientesService,
    private readonly planesService: PlanesEntrenamientoService,
    private readonly registrosService: RegistrosService,
    private readonly progresoService: ProgresoService,
  ) {}

  async getDashboardCliente(
    clienteId: string,
    workspaceId: string,
  ): Promise<ClienteDashboard> {
    const [cliente, planes, registrosResult, progresoSemanal] = await Promise.all([
      this.clientesService.findById(clienteId, workspaceId),
      this.planesService.findAll(workspaceId),
      this.registrosService.listar(clienteId, { page: 1, limit: 5 }),
      this.progresoService.calcularProgreso(clienteId, 'semanal'),
    ]);

    const planActivo = planes.find((p) => p.estado === EstadoPlan.ACTIVO) ?? null;

    return { cliente, planActivo, ultimosRegistros: registrosResult.registros, progresoSemanal };
  }
}
```

Las cuatro consultas corren en paralelo con `Promise.all`. La facade además aplica la lógica de selección del `planActivo`: de todos los planes del workspace, toma el primero con estado `ACTIVO`.

La regla de repositorios se cumple: la facade no importa ningún repositorio ni `PrismaService`. Solo habla con servicios.

El tipo de retorno `ClienteDashboard` documenta el contrato de la respuesta:

```ts
export interface ClienteDashboard {
  cliente: ClienteConPerfil;
  planActivo: PlanConEjercicios | null;
  ultimosRegistros: RegistroConEjercicios[];
  progresoSemanal: ProgresoResumen;
}
```

### 2. `DashboardController`

Archivo:

```txt
apps/api/src/modules/dashboard/controllers/dashboard.controller.ts
```

Es el único consumidor de la facade. No conoce a `ClientesService`, `PlanesEntrenamientoService` ni a ningún repositorio. Solo conoce a `ClienteDashboardFacade`:

```ts
@Get('clientes/:id/dashboard')
@Roles('ENTRENADOR')
async getDashboard(
  @Param('id') clienteId: string,
  @CurrentWorkspace() workspaceId: string,
) {
  const dashboard = await this.dashboardFacade.getDashboardCliente(clienteId, workspaceId);
  return { dashboard };
}
```

### 3. `DashboardModule`

Archivo:

```txt
apps/api/src/modules/dashboard/dashboard.module.ts
```

Importa los módulos de los cuatro subsistemas para que NestJS pueda inyectar sus servicios en la facade:

```ts
@Module({
  imports: [ClientesModule, PlanesEntrenamientoModule, RegistrosModule, ProgresoModule],
  controllers: [DashboardController],
  providers: [ClienteDashboardFacade],
})
export class DashboardModule {}
```

## Para qué sirve en este proyecto

Sin Facade, el controller tendría que coordinar los cuatro servicios directamente:

```ts
async getDashboard(clienteId, workspaceId) {
  const cliente   = await this.clientesService.findById(clienteId, workspaceId);
  const planes    = await this.planesService.findAll(workspaceId);
  const registros = await this.registrosService.listar(clienteId, { page: 1, limit: 5 });
  const progreso  = await this.progresoService.calcularProgreso(clienteId, 'semanal');
  const planActivo = planes.find(p => p.estado === EstadoPlan.ACTIVO) ?? null;
  // armar respuesta...
}
```

Eso implica que el controller conoce cuántos servicios hay, cómo se llaman, qué parámetros requieren y cómo componer el resultado. Si la lógica de composición cambia, hay que modificar el controller.

Con Facade, el controller hace una sola llamada:

```ts
const dashboard = await this.dashboardFacade.getDashboardCliente(clienteId, workspaceId);
```

Ventajas:

- El controller queda completamente desacoplado de los servicios del subsistema.
- Toda la lógica de composición vive en un solo lugar (`getDashboardCliente`), fácil de encontrar y modificar.
- Agregar un nuevo bloque al dashboard (por ejemplo, notificaciones no leídas) solo requiere modificar la facade, no el controller.
- La facade se puede testear de forma aislada mockeando los cuatro servicios, sin levantar nada de infraestructura.
- `Promise.all` garantiza que las cuatro consultas corran en paralelo; centralizar eso en la facade asegura que ningún llamador futuro olvide hacerlo.

## Flujo del dashboard

Cuando se llama:

```http
GET /api/clientes/abc123/dashboard
```

ocurre este flujo:

```txt
DashboardController
  └── dashboardFacade.getDashboardCliente(clienteId, workspaceId)
        └── Promise.all([
              ClientesService.findById(clienteId, workspaceId)
                └── ClientesRepository → BD
              PlanesEntrenamientoService.findAll(workspaceId)
                └── PlanesEntrenamientoRepository → BD
              RegistrosService.listar(clienteId, { limit: 5 })
                └── RegistrosEntrenamientoRepository → BD
              ProgresoService.calcularProgreso(clienteId, "semanal")
                └── RegistrosEntrenamientoRepository → BD
                └── ProgresoSemanalStrategy.calcular(registros)
            ])
        └── filtra planActivo (estado === ACTIVO)
        └── retorna ClienteDashboard
```

Las cuatro ramas de `Promise.all` corren en paralelo. La respuesta final llega cuando la más lenta termina.

## Resumen

El patrón **Facade** se usa aquí para que el frontend (o cualquier consumidor de la API) obtenga toda la información del dashboard de un cliente con una sola petición HTTP, sin conocer la estructura interna del subsistema. `ClienteDashboardFacade` coordina cuatro servicios en paralelo, aplica la selección del plan activo y devuelve un objeto compuesto y tipado. El controller queda reducido a una línea de lógica.
