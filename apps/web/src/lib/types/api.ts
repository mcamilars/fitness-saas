export type EstadoCliente = "ACTIVO" | "INACTIVO" | "PENDIENTE";
export type EstadoPlan = "BORRADOR" | "ACTIVO" | "ARCHIVADO";
export type TipoPlan = "HIPERTROFIA" | "FUERZA" | "RESISTENCIA";
export type GrupoMuscular =
  | "PECHO"
  | "ESPALDA"
  | "HOMBROS"
  | "BICEPS"
  | "TRICEPS"
  | "PIERNA"
  | "GLUTEOS"
  | "CORE"
  | "CARDIO";

export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  estado: EstadoCliente;
  fechaAlta: string;
  workspaceId: string;
  planActivoId?: string;
}

export interface PlanDeEntrenamiento {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: TipoPlan;
  estado: EstadoPlan;
  workspaceId: string;
  ejercicios: EjercicioPlan[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface Ejercicio {
  id: string;
  nombre: string;
  grupoMuscular: GrupoMuscular;
  descripcion: string;
  instrucciones: string;
  imagenUrl?: string;
  videoUrl?: string;
  creadoEn: string;
}

export interface EjercicioPlan {
  id: string;
  planId: string;
  ejercicioId: string;
  ejercicio: Ejercicio;
  orden: number;
  series: number;
  repeticiones: number;
  segundosDeDescanso: number;
  notas?: string;
}

export interface RegistroDeEntrenamiento {
  id: string;
  clienteId: string;
  planId?: string;
  fecha: string;
  duracionMin: number;
  notas?: string;
  ejercicios: RegistroEjercicio[];
  creadoEn: string;
}

export interface RegistroEjercicio {
  id: string;
  registroId: string;
  ejercicioId: string;
  ejercicio?: Ejercicio;
  series: number;
  repeticiones: number;
  pesoKg?: number;
  notas?: string;
}

export interface Notificacion {
  id: string;
  clienteId: string;
  mensaje: string;
  leida: boolean;
  tipo: "PLAN_ACTIVADO" | "REGISTRO_AGREGADO" | "CLIENTE_INVITADO" | "SISTEMA";
  creadoEn: string;
}

export interface DashboardCliente {
  cliente: Cliente;
  planActivo?: PlanDeEntrenamiento;
  ultimosRegistros: RegistroDeEntrenamiento[];
  progresoSemanal: ProgresoSemanal[];
}

export interface ProgresoSemanal {
  etiqueta: string;
  entrenamientos: number;
  volumenTotal: number;
  pesoPromedio?: number;
}

export interface ProgresoResumen {
  tipo: "semanal" | "mensual" | "porPlan";
  datos: ProgresoSemanal[];
  volumenTotal: number;
  promedioPeso: number;
  totalEntrenarios: number;
}