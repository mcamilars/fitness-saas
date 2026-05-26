/**
 * Seed de la base de datos — datos de prueba para el fitness SaaS.
 *
 * Crea un escenario completo y coherente para ejercitar todos los módulos:
 * espacios de trabajo, entrenadores, clientes, catálogo de ejercicios,
 * planes de entrenamiento (con ejercicios), asignaciones, registros de
 * entrenamiento, invitaciones pendientes y notificaciones.
 *
 * Ejecutar:  pnpm db:seed   (o  pnpm --filter @repo/database db:seed)
 *
 * Las credenciales generadas quedan documentadas en
 * `prisma/SEED_CREDENTIALS.md`. La contraseña es la misma para todos los
 * usuarios para facilitar las pruebas.
 */
import {
  EstadoAsignacion,
  EstadoPlan,
  GrupoMuscular,
  PrismaClient,
  Rol,
  TipoPlanEntrenamiento,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;
const CONTRASENA = 'Password123!';

async function limpiarBaseDeDatos(): Promise<void> {
  // Orden inverso de dependencias para respetar las llaves foráneas.
  await prisma.notificacion.deleteMany();
  await prisma.registroDeEjercicio.deleteMany();
  await prisma.registroDeEntrenamiento.deleteMany();
  await prisma.asignacionPlanEntrenamiento.deleteMany();
  await prisma.ejercicioPlan.deleteMany();
  await prisma.planDeEntrenamiento.deleteMany();
  await prisma.ejercicio.deleteMany();
  await prisma.invitacion.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.entrenador.deleteMany();
  await prisma.espacioDeTrabajo.deleteMany();
  await prisma.usuario.deleteMany();
}

async function main(): Promise<void> {
  console.log('🧹 Limpiando base de datos...');
  await limpiarBaseDeDatos();

  const contrasenaHash = await bcrypt.hash(CONTRASENA, BCRYPT_ROUNDS);

  // ============================================================
  // ENTRENADOR 1 — FitPro Studio (workspace principal de pruebas)
  // ============================================================
  console.log('🏋️  Creando entrenadores y espacios de trabajo...');

  const usuarioCarlos = await prisma.usuario.create({
    data: {
      correo: 'carlos@fitpro.com',
      contrasenaHash,
      nombre: 'Carlos',
      apellido: 'Ramírez',
      rol: Rol.ENTRENADOR,
    },
  });

  const workspaceFitPro = await prisma.espacioDeTrabajo.create({
    data: { nombre: 'FitPro Studio', slug: 'fitpro-studio' },
  });

  const entrenadorCarlos = await prisma.entrenador.create({
    data: {
      usuarioId: usuarioCarlos.id,
      espacioDeTrabajoId: workspaceFitPro.id,
    },
  });

  // ============================================================
  // ENTRENADOR 2 — PowerHouse Gym (segundo tenant para probar aislamiento)
  // ============================================================
  const usuarioLaura = await prisma.usuario.create({
    data: {
      correo: 'laura@powerhouse.com',
      contrasenaHash,
      nombre: 'Laura',
      apellido: 'Gómez',
      rol: Rol.ENTRENADOR,
    },
  });

  const workspacePowerHouse = await prisma.espacioDeTrabajo.create({
    data: { nombre: 'PowerHouse Gym', slug: 'powerhouse-gym' },
  });

  const entrenadorLaura = await prisma.entrenador.create({
    data: {
      usuarioId: usuarioLaura.id,
      espacioDeTrabajoId: workspacePowerHouse.id,
    },
  });

  // ============================================================
  // CLIENTES
  // ============================================================
  console.log('🧑‍🤝‍🧑 Creando clientes...');

  async function crearCliente(
    correo: string,
    nombre: string,
    apellido: string,
    entrenadorId: string,
    espacioDeTrabajoId: string,
  ) {
    const usuario = await prisma.usuario.create({
      data: {
        correo,
        contrasenaHash,
        nombre,
        apellido,
        rol: Rol.CLIENTE,
      },
    });
    return prisma.cliente.create({
      data: {
        usuarioId: usuario.id,
        entrenadorId,
        espacioDeTrabajoId,
      },
    });
  }

  const clienteAna = await crearCliente(
    'ana@example.com',
    'Ana',
    'Torres',
    entrenadorCarlos.id,
    workspaceFitPro.id,
  );
  const clienteBruno = await crearCliente(
    'bruno@example.com',
    'Bruno',
    'Díaz',
    entrenadorCarlos.id,
    workspaceFitPro.id,
  );
  const clienteCarmen = await crearCliente(
    'carmen@example.com',
    'Carmen',
    'Ruiz',
    entrenadorCarlos.id,
    workspaceFitPro.id,
  );
  // Cliente del segundo entrenador (otro tenant).
  await crearCliente(
    'diego@example.com',
    'Diego',
    'Mora',
    entrenadorLaura.id,
    workspacePowerHouse.id,
  );

  // ============================================================
  // CATÁLOGO DE EJERCICIOS (global)
  // ============================================================
  console.log('💪 Creando catálogo de ejercicios...');

  const ejerciciosData = [
    // PECHO
    { nombre: 'Press de banca', grupoMuscular: GrupoMuscular.PECHO, descripcion: 'Ejercicio compuesto para el pecho.' },
    { nombre: 'Press inclinado con mancuernas', grupoMuscular: GrupoMuscular.PECHO, descripcion: 'Énfasis en la porción superior del pectoral.' },
    { nombre: 'Aperturas con mancuernas', grupoMuscular: GrupoMuscular.PECHO, descripcion: 'Aislamiento del pectoral en apertura.' },
    { nombre: 'Press en máquina (pec deck)', grupoMuscular: GrupoMuscular.PECHO, descripcion: 'Contracción de pecho guiada por máquina.' },
    // ESPALDA
    { nombre: 'Peso muerto', grupoMuscular: GrupoMuscular.ESPALDA, descripcion: 'Levantamiento de cadena posterior.' },
    { nombre: 'Dominadas', grupoMuscular: GrupoMuscular.ESPALDA, descripcion: 'Tracción vertical con peso corporal.' },
    { nombre: 'Remo con barra', grupoMuscular: GrupoMuscular.ESPALDA, descripcion: 'Tracción horizontal para dorsales.' },
    { nombre: 'Jalón al pecho', grupoMuscular: GrupoMuscular.ESPALDA, descripcion: 'Tracción vertical en polea.' },
    { nombre: 'Remo en polea baja', grupoMuscular: GrupoMuscular.ESPALDA, descripcion: 'Remo sentado en polea.' },
    // HOMBROS
    { nombre: 'Press militar', grupoMuscular: GrupoMuscular.HOMBROS, descripcion: 'Empuje vertical para hombros.' },
    { nombre: 'Elevaciones laterales', grupoMuscular: GrupoMuscular.HOMBROS, descripcion: 'Aislamiento del deltoides lateral.' },
    { nombre: 'Pájaros (deltoide posterior)', grupoMuscular: GrupoMuscular.HOMBROS, descripcion: 'Trabajo del deltoides posterior.' },
    { nombre: 'Press Arnold', grupoMuscular: GrupoMuscular.HOMBROS, descripcion: 'Press con rotación para todo el deltoides.' },
    // BÍCEPS
    { nombre: 'Curl de bíceps', grupoMuscular: GrupoMuscular.BICEPS, descripcion: 'Aislamiento de bíceps con mancuernas.' },
    { nombre: 'Curl martillo', grupoMuscular: GrupoMuscular.BICEPS, descripcion: 'Trabaja bíceps y braquial.' },
    { nombre: 'Curl con barra Z', grupoMuscular: GrupoMuscular.BICEPS, descripcion: 'Curl de bíceps con barra EZ.' },
    // TRÍCEPS
    { nombre: 'Fondos en paralelas', grupoMuscular: GrupoMuscular.TRICEPS, descripcion: 'Empuje para tríceps y pecho.' },
    { nombre: 'Extensión de tríceps en polea', grupoMuscular: GrupoMuscular.TRICEPS, descripcion: 'Aislamiento de tríceps en polea alta.' },
    { nombre: 'Press francés', grupoMuscular: GrupoMuscular.TRICEPS, descripcion: 'Extensión de tríceps tumbado.' },
    // PIERNAS
    { nombre: 'Sentadilla', grupoMuscular: GrupoMuscular.PIERNAS, descripcion: 'Rey de los ejercicios de pierna.' },
    { nombre: 'Prensa de piernas', grupoMuscular: GrupoMuscular.PIERNAS, descripcion: 'Empuje de cuádriceps en máquina.' },
    { nombre: 'Zancadas', grupoMuscular: GrupoMuscular.PIERNAS, descripcion: 'Trabajo unilateral de piernas.' },
    { nombre: 'Extensión de cuádriceps', grupoMuscular: GrupoMuscular.PIERNAS, descripcion: 'Aislamiento de cuádriceps.' },
    { nombre: 'Curl femoral', grupoMuscular: GrupoMuscular.PIERNAS, descripcion: 'Aislamiento de isquiotibiales.' },
    { nombre: 'Elevación de gemelos', grupoMuscular: GrupoMuscular.PIERNAS, descripcion: 'Trabajo de pantorrillas.' },
    // GLÚTEOS
    { nombre: 'Hip thrust', grupoMuscular: GrupoMuscular.GLUTEOS, descripcion: 'Activación de glúteos.' },
    { nombre: 'Puente de glúteos', grupoMuscular: GrupoMuscular.GLUTEOS, descripcion: 'Activación de glúteos con peso corporal.' },
    { nombre: 'Patada de glúteo en polea', grupoMuscular: GrupoMuscular.GLUTEOS, descripcion: 'Aislamiento de glúteo en polea baja.' },
    // CORE
    { nombre: 'Plancha', grupoMuscular: GrupoMuscular.CORE, descripcion: 'Isométrico de core.' },
    { nombre: 'Crunch abdominal', grupoMuscular: GrupoMuscular.CORE, descripcion: 'Flexión de tronco para abdominales.' },
    { nombre: 'Elevación de piernas colgado', grupoMuscular: GrupoMuscular.CORE, descripcion: 'Trabajo del abdomen inferior.' },
    { nombre: 'Russian twist', grupoMuscular: GrupoMuscular.CORE, descripcion: 'Rotación de tronco para oblicuos.' },
    // CUERPO COMPLETO
    { nombre: 'Burpees', grupoMuscular: GrupoMuscular.CUERPO_COMPLETO, descripcion: 'Ejercicio metabólico de cuerpo completo.' },
    { nombre: 'Thruster', grupoMuscular: GrupoMuscular.CUERPO_COMPLETO, descripcion: 'Sentadilla frontal combinada con press.' },
    { nombre: 'Clean and press', grupoMuscular: GrupoMuscular.CUERPO_COMPLETO, descripcion: 'Cargada y press olímpico.' },
    { nombre: 'Kettlebell swing', grupoMuscular: GrupoMuscular.CUERPO_COMPLETO, descripcion: 'Balanceo explosivo de cadera con pesa rusa.' },
    // OTRO
    { nombre: 'Saltar la cuerda', grupoMuscular: GrupoMuscular.OTRO, descripcion: 'Cardio de bajo impacto y coordinación.' },
    { nombre: 'Carrera en cinta', grupoMuscular: GrupoMuscular.OTRO, descripcion: 'Cardio continuo en cinta.' },
    { nombre: 'Estiramiento de movilidad', grupoMuscular: GrupoMuscular.OTRO, descripcion: 'Rutina de movilidad y flexibilidad.' },
  ];

  const ejercicios = [];
  for (const data of ejerciciosData) {
    ejercicios.push(await prisma.ejercicio.create({ data }));
  }
  const ejPorNombre = new Map(ejercicios.map((e) => [e.nombre, e]));

  // ============================================================
  // PLANES DE ENTRENAMIENTO (del entrenador Carlos)
  // ============================================================
  console.log('📋 Creando planes de entrenamiento...');

  const planHipertrofia = await prisma.planDeEntrenamiento.create({
    data: {
      entrenadorId: entrenadorCarlos.id,
      nombre: 'Hipertrofia Full Body',
      descripcion: 'Plan de hipertrofia de cuerpo completo, 3 días por semana.',
      tipo: TipoPlanEntrenamiento.HIPERTROFIA,
      estado: EstadoPlan.ACTIVO,
      ejercicioPlanes: {
        create: [
          { ejercicioId: ejPorNombre.get('Press de banca')!.id, series: 4, repeticiones: 10, segundosDeDescanso: 90, orden: 1 },
          { ejercicioId: ejPorNombre.get('Sentadilla')!.id, series: 4, repeticiones: 12, segundosDeDescanso: 120, orden: 2 },
          { ejercicioId: ejPorNombre.get('Dominadas')!.id, series: 3, repeticiones: 8, segundosDeDescanso: 90, orden: 3 },
          { ejercicioId: ejPorNombre.get('Curl de bíceps')!.id, series: 3, repeticiones: 12, segundosDeDescanso: 60, orden: 4 },
        ],
      },
    },
  });

  const planFuerza = await prisma.planDeEntrenamiento.create({
    data: {
      entrenadorId: entrenadorCarlos.id,
      nombre: 'Fuerza 5x5',
      descripcion: 'Programa de fuerza básico con levantamientos pesados.',
      tipo: TipoPlanEntrenamiento.FUERZA,
      estado: EstadoPlan.ACTIVO,
      ejercicioPlanes: {
        create: [
          { ejercicioId: ejPorNombre.get('Sentadilla')!.id, series: 5, repeticiones: 5, segundosDeDescanso: 180, orden: 1 },
          { ejercicioId: ejPorNombre.get('Peso muerto')!.id, series: 5, repeticiones: 5, segundosDeDescanso: 180, orden: 2 },
          { ejercicioId: ejPorNombre.get('Press militar')!.id, series: 5, repeticiones: 5, segundosDeDescanso: 150, orden: 3 },
        ],
      },
    },
  });

  // Un plan en BORRADOR (sin asignar) para probar el flujo de estados.
  await prisma.planDeEntrenamiento.create({
    data: {
      entrenadorId: entrenadorCarlos.id,
      nombre: 'Resistencia metabólica',
      descripcion: 'Borrador de circuito de alta intensidad.',
      tipo: TipoPlanEntrenamiento.RESISTENCIA,
      estado: EstadoPlan.BORRADOR,
      ejercicioPlanes: {
        create: [
          { ejercicioId: ejPorNombre.get('Burpees')!.id, series: 4, repeticiones: 15, segundosDeDescanso: 45, orden: 1 },
          { ejercicioId: ejPorNombre.get('Plancha')!.id, series: 3, repeticiones: 1, segundosDeDescanso: 60, notas: '60 segundos de plancha.', orden: 2 },
        ],
      },
    },
  });

  // ============================================================
  // ASIGNACIONES
  // ============================================================
  console.log('🔗 Asignando planes a clientes...');

  await prisma.asignacionPlanEntrenamiento.create({
    data: {
      clienteId: clienteAna.id,
      planDeEntrenamientoId: planHipertrofia.id,
      estado: EstadoAsignacion.ACTIVO,
    },
  });
  await prisma.asignacionPlanEntrenamiento.create({
    data: {
      clienteId: clienteBruno.id,
      planDeEntrenamientoId: planFuerza.id,
      estado: EstadoAsignacion.ACTIVO,
    },
  });
  // Carmen tuvo una asignación que luego se desactivó.
  await prisma.asignacionPlanEntrenamiento.create({
    data: {
      clienteId: clienteCarmen.id,
      planDeEntrenamientoId: planHipertrofia.id,
      estado: EstadoAsignacion.INACTIVO,
    },
  });

  // ============================================================
  // REGISTROS DE ENTRENAMIENTO (de Ana)
  // ============================================================
  console.log('📝 Creando registros de entrenamiento...');

  await prisma.registroDeEntrenamiento.create({
    data: {
      clienteId: clienteAna.id,
      fecha: new Date('2026-05-20T08:00:00Z'),
      notas: 'Buena sesión, subí peso en press.',
      duracionMin: 65,
      ejercicios: {
        create: [
          { nombre: 'Press de banca', grupoMuscular: GrupoMuscular.PECHO, series: 4, repeticiones: 10, pesoKg: 40 },
          { nombre: 'Sentadilla', grupoMuscular: GrupoMuscular.PIERNAS, series: 4, repeticiones: 12, pesoKg: 50 },
          { nombre: 'Curl de bíceps', grupoMuscular: GrupoMuscular.BICEPS, series: 3, repeticiones: 12, pesoKg: 10 },
        ],
      },
    },
  });

  await prisma.registroDeEntrenamiento.create({
    data: {
      clienteId: clienteAna.id,
      fecha: new Date('2026-05-23T08:30:00Z'),
      notas: 'Algo cansada pero completé todo.',
      duracionMin: 58,
      ejercicios: {
        create: [
          { nombre: 'Press de banca', grupoMuscular: GrupoMuscular.PECHO, series: 4, repeticiones: 10, pesoKg: 42.5 },
          { nombre: 'Dominadas', grupoMuscular: GrupoMuscular.ESPALDA, series: 3, repeticiones: 6, notas: 'Con banda elástica.' },
        ],
      },
    },
  });

  // Un registro de Bruno.
  await prisma.registroDeEntrenamiento.create({
    data: {
      clienteId: clienteBruno.id,
      fecha: new Date('2026-05-24T18:00:00Z'),
      notas: 'Día de fuerza.',
      duracionMin: 72,
      ejercicios: {
        create: [
          { nombre: 'Sentadilla', grupoMuscular: GrupoMuscular.PIERNAS, series: 5, repeticiones: 5, pesoKg: 100 },
          { nombre: 'Peso muerto', grupoMuscular: GrupoMuscular.ESPALDA, series: 5, repeticiones: 5, pesoKg: 120 },
        ],
      },
    },
  });

  // ============================================================
  // INVITACIÓN PENDIENTE (workspace de Carlos)
  // ============================================================
  console.log('✉️  Creando invitación pendiente...');

  const expiraEn = new Date();
  expiraEn.setDate(expiraEn.getDate() + 7);
  await prisma.invitacion.create({
    data: {
      espacioDeTrabajoId: workspaceFitPro.id,
      correo: 'nuevo.cliente@example.com',
      token: 'seed-invitacion-token-fitpro-001',
      expiraEn,
      consumida: false,
    },
  });

  // ============================================================
  // NOTIFICACIONES
  // ============================================================
  console.log('🔔 Creando notificaciones...');

  await prisma.notificacion.createMany({
    data: [
      { clienteId: clienteAna.id, mensaje: 'Se te ha asignado el plan "Hipertrofia Full Body".', leida: false },
      { clienteId: clienteAna.id, mensaje: '¡Buen trabajo en tu última sesión!', leida: true },
      { clienteId: clienteBruno.id, mensaje: 'Se te ha asignado el plan "Fuerza 5x5".', leida: false },
    ],
  });

  console.log('\n✅ Seed completado con éxito.');
  console.log('   Contraseña para todos los usuarios:', CONTRASENA);
  console.log('   Ver credenciales en prisma/SEED_CREDENTIALS.md\n');
}

main()
  .catch((e) => {
    console.error('❌ Error al ejecutar el seed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
