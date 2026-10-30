/**
 * @fileoverview Siembra de datos iniciales (demo y datos de AYNI HEALTH).
 * @module server/db/seed
 */

import bcrypt from 'bcrypt'
import { randomBytes } from 'node:crypto'
import { config } from '../config.js'
import { modelos } from './modelos.js'

/**
 * Siembra los datos iniciales si la base está vacía.
 * En producción NO se ejecuta (no crea datos demo ni toca la base).
 * Nunca resetea `intentos_fallidos` ni `bloqueado_hasta` de usuarios existentes:
 * solo usa `findOrCreate`, que no actualiza filas ya presentes.
 * @param {string} [nodeEnv] - Entorno (por defecto `config.NODE_ENV`). Parametrizado para pruebas.
 * @returns {Promise<void>} Promesa.
 */
export async function sembrar(nodeEnv = config.NODE_ENV) {
  if (nodeEnv === 'production') return

  const { Usuario, Tripulante, Alimento, Contramedida, UmbralClinico, ConfiguracionIA, RateLimit, EntornoMision, CatalogoIndicador, Registro, SignoVital, RegistroSueno, RegistroGlucosa, RegistroAnimo, RegistroEjercicio, RegistroEstadoConductual, AccionSalud, Alerta } = modelos

  // Los contadores de rate limit son transitorios (ventana de 15 min): se limpian
  // en cada siembra para que los arranques en desarrollo/CI no arrastren límites.
  await RateLimit.destroy({ where: {} })

  // Administrador demo (solo DEMO_MODE=true), con su propio perfil de tripulante.
  if (config.DEMO_MODE === 'true') {
    await Usuario.findOrCreate({
      where: { email: 'admin@ayni.health' },
      defaults: {
        nombre: 'Administrador',
        email: 'admin@ayni.health',
        password: await bcrypt.hash('admin123', 12),
        rol: 'administrador',
      },
    })
  }

  // Tripulantes actuales (existen sin cuenta vinculada).
  const [ana] = await Tripulante.findOrCreate({
    where: { nombre: 'Ana Quispe' },
    defaults: { cargo: 'Comandante', edad: 38, peso_kg: 62, altura_cm: 165, dia_mision: 120, mision: 'Misión Artemis', objetivo: 'Mantener densidad ósea y gestionar el estrés', alergias: ['lactosa'] },
  })
  const [diego] = await Tripulante.findOrCreate({
    where: { nombre: 'Diego Mamani' },
    defaults: { cargo: 'Ingeniero de Vuelo', edad: 41, peso_kg: 78, altura_cm: 178, dia_mision: 120, mision: 'Misión Artemis' },
  })
  const [lucia] = await Tripulante.findOrCreate({
    where: { nombre: 'Lucía Condori' },
    defaults: { cargo: 'Oficial Médico', edad: 35, peso_kg: 58, altura_cm: 160, dia_mision: 120, mision: 'Misión Artemis' },
  })

  // Entornos de misión (reto).
  const entornos = [
    { nombre: 'Nave en tránsito', descripcion: 'Nave espacial en trayecto a la Luna o Marte.', peligros_relevantes: ['radiacion', 'aislamiento', 'distancia', 'gravedad', 'entorno_cerrado'] },
    { nombre: 'Estación orbital', descripcion: 'Estación en órbita baja terrestre.', peligros_relevantes: ['radiacion', 'gravedad', 'entorno_cerrado'] },
    { nombre: 'Rover', descripcion: 'Vehículo de exploración en superficie.', peligros_relevantes: ['radiacion', 'aislamiento', 'distancia'] },
    { nombre: 'Base lunar', descripcion: 'Hábitat en la superficie de la Luna.', peligros_relevantes: ['radiacion', 'gravedad', 'entorno_cerrado'] },
    { nombre: 'Base marciana', descripcion: 'Hábitat en la superficie de Marte.', peligros_relevantes: ['radiacion', 'aislamiento', 'distancia', 'entorno_cerrado'] },
    { nombre: 'Análogo terrestre Cusco', descripcion: 'Análogo a 3 400 m sobre el nivel del mar (Perú).', peligros_relevantes: ['aislamiento', 'entorno_cerrado'] },
  ]
  const entornoPorNombre = {}
  for (const e of entornos) {
    const [entorno] = await EntornoMision.findOrCreate({ where: { nombre: e.nombre }, defaults: e })
    entornoPorNombre[e.nombre] = entorno
  }
  // Vincula a los tripulantes al análogo Cusco (si no tienen entorno).
  for (const t of [ana, diego, lucia]) {
    if (!t.entorno_id) await t.update({ entorno_id: entornoPorNombre['Análogo terrestre Cusco'].id })
  }

  // Perfil de tripulante del administrador (para que también pueda registrarse a sí mismo).
  if (config.DEMO_MODE === 'true') {
    const admin = await Usuario.findOne({ where: { email: 'admin@ayni.health' } })
    if (admin) {
      const [perfilAdmin] = await Tripulante.findOrCreate({
        where: { usuario_id: admin.id },
        defaults: { nombre: 'Admin Médico', cargo: 'Supervisor de misión', edad: 40, dia_mision: 120, mision: 'Misión Artemis', entorno_id: entornoPorNombre['Análogo terrestre Cusco'].id, usuario_id: admin.id },
      })
      if (!perfilAdmin.entorno_id) await perfilAdmin.update({ entorno_id: entornoPorNombre['Análogo terrestre Cusco'].id })
    }
  }

  // Catálogo de indicadores (guía del reto). Fuentes pendientes de verificar.
  const indicadores = [
    { nombre: 'Presión arterial', unidad: 'mmHg', rango_referencia: '120/80', peligro_asociado: 'cardiovascular', como_medir: 'Con un tensiómetro, en reposo y con el brazo a la altura del corazón.', por_que: 'Detecta cambios cardiovasculares por la microgravedad y el estrés.', como_afecta: 'La microgravedad desplaza líquidos hacia la parte superior del cuerpo y puede elevar la presión.', cuando_escalar: 'Avisa al oficial médico si se mantiene por encima de 140/90 o por debajo de 90/60 con síntomas.', acciones_preventivas: 'Ejercicio aeróbico diario, hidratación y control de la ingesta de sodio.', fuente: 'NASA Human Research Program (pendiente de verificar)' },
    { nombre: 'Frecuencia cardíaca', unidad: 'lpm', rango_referencia: '60-100', peligro_asociado: 'cardiovascular', como_medir: 'Con pulsómetro de muñeca o monitor de pecho, en reposo.', por_que: 'Refleja la carga cardiovascular, el estrés y el estado físico.', como_afecta: 'El desacondicionamiento cardiovascular y el estrés pueden elevar la frecuencia en reposo.', cuando_escalar: 'Avisa si supera 120 lpm en reposo de forma repetida o si hay dolor en el pecho.', acciones_preventivas: 'Entrenamiento aeróbico y de resistencia, y técnicas de manejo del estrés.', fuente: 'NASA HRP (pendiente de verificar)' },
    { nombre: 'Glucosa', unidad: 'mg/dL', rango_referencia: '70-100 (ayunas)', peligro_asociado: 'nutricion', como_medir: 'Con un glucómetro y una gota de sangre capilar, preferiblemente en ayunas.', por_que: 'Controla el metabolismo y detecta problemas de nutrición.', como_afecta: 'La dieta espacial y la reducción de actividad pueden alterar los niveles de azúcar.', cuando_escalar: 'Avisa si baja de 54 mg/dL o sube por encima de 250 mg/dL.', acciones_preventivas: 'Dieta equilibrada, ejercicio regular y monitoreo en ayunas.', fuente: 'Agencias espaciales (pendiente de verificar)' },
    { nombre: 'Temperatura corporal', unidad: '°C', rango_referencia: '36-37.5', peligro_asociado: 'inmune', como_medir: 'Con un termómetro digital, en reposo.', por_que: 'Detecta fiebre (posible infección) o hipotermia.', como_afecta: 'Los cambios inmunes en el espacio pueden favorecer infecciones con fiebre.', cuando_escalar: 'Avisa si supera 38 °C o baja de 35 °C.', acciones_preventivas: 'Higiene, sueño adecuado y control del ambiente de cabina.', fuente: 'General (pendiente de verificar)' },
    { nombre: 'Sueño', unidad: 'horas', rango_referencia: '7-9', peligro_asociado: 'conductual', como_medir: 'Registra las horas de sueño y tu percepción de descanso.', por_que: 'El sueño insuficiente afecta el ánimo, la atención y el rendimiento.', como_afecta: 'El entorno cerrado, la luz artificial y el estrés alteran el ciclo de sueño.', cuando_escalar: 'Avisa si duermes menos de 5 horas varios días seguidos o si hay insomnio persistente.', acciones_preventivas: 'Higiene del sueño: horario fijo, poca luz antes de dormir y evitar cafeína.', fuente: 'NASA HRP (pendiente de verificar)' },
    { nombre: 'Ánimo', unidad: 'escala 1-10', rango_referencia: '≥7', peligro_asociado: 'conductual', como_medir: 'Autoevalúa tu estado de ánimo en una escala del 1 al 10 cada día.', por_que: 'Detecta deterioro conductual por aislamiento y confinamiento.', como_afecta: 'La distancia de la Tierra y el aislamiento pueden bajar el ánimo y aumentar la ansiedad.', cuando_escalar: 'Avisa si el ánimo se mantiene bajo (≤3) varios días o si hay pensamientos de hacerse daño.', acciones_preventivas: 'Apoyo psicológico, comunicación con la tripulación y rutinas de bienestar.', fuente: 'NASA HRP (pendiente de verificar)' },
    { nombre: 'Radiación', unidad: 'mSv', rango_referencia: 'según umbral', peligro_asociado: 'radiacion', como_medir: 'Con un dosímetro personal que registra la dosis acumulada.', por_que: 'Controla la exposición acumulada a radiación espacial.', como_afecta: 'La radiación puede dañar células y elevar el riesgo de enfermedades a largo plazo.', cuando_escalar: 'Avisa si la dosis acumulada supera el umbral configurado por el oficial médico.', acciones_preventivas: 'Permanecer en zonas blindadas durante tormentas solares y seguir el protocolo.', fuente: 'NASA HRP (pendiente de verificar)' },
  ]
  for (const i of indicadores) {
    await CatalogoIndicador.findOrCreate({ where: { nombre: i.nombre }, defaults: i })
  }

  // Escenario de demostración (120 días) solo en modo demo.
  if (config.DEMO_MODE === 'true') {
    await sembrarEscenarioDemo({ ana, diego, lucia, Registro, SignoVital, RegistroSueno, RegistroGlucosa, RegistroAnimo, RegistroEjercicio, RegistroEstadoConductual, AccionSalud, Alerta })
  }

  // Alimentos (superalimentos andinos y despensa).
  const alimentos = [
    { nombre: 'Maca', categoria: 'superalimento_andino', beneficio: 'Densidad ósea y resistencia', origen_andino: true },
    { nombre: 'Quinua', categoria: 'superalimento_andino', beneficio: 'Proteína completa muscular', origen_andino: true },
    { nombre: 'Muña', categoria: 'superalimento_andino', beneficio: 'Alivio digestivo', origen_andino: true },
    { nombre: 'Kiwicha', categoria: 'superalimento_andino', beneficio: 'Hierro para glóbulos rojos', origen_andino: true },
    { nombre: 'Tarwi', categoria: 'superalimento_andino', beneficio: 'Proteína vegetal', origen_andino: true },
    { nombre: 'Cañihua', categoria: 'superalimento_andino', beneficio: 'Proteína y fibra', origen_andino: true },
    { nombre: 'Chuño', categoria: 'superalimento_andino', beneficio: 'Energía de altura', origen_andino: true },
    { nombre: 'Mashua', categoria: 'superalimento_andino', beneficio: 'Nutriente andino', origen_andino: true },
    { nombre: 'Sacha Inchi', categoria: 'superalimento_andino', beneficio: 'Omega-3 antiinflamatorio', origen_andino: true },
    { nombre: 'Arroz fortificado', categoria: 'despensa', kcal: 210, proteina_g: 5, carbohidratos_g: 45, grasa_g: 1, porcion: '100 g', beneficio: 'Energía de base', origen_andino: false },
    { nombre: 'Verduras rehidratadas', categoria: 'despensa', kcal: 60, proteina_g: 3, carbohidratos_g: 12, grasa_g: 0, porcion: '150 g', beneficio: 'Vitaminas y fibra', origen_andino: false },
    { nombre: 'Lentejas', categoria: 'despensa', kcal: 116, proteina_g: 9, carbohidratos_g: 20, grasa_g: 0.4, porcion: '100 g cocidas', beneficio: 'Proteína vegetal y hierro', origen_andino: false },
    { nombre: 'Garbanzos', categoria: 'despensa', kcal: 164, proteina_g: 9, carbohidratos_g: 27, grasa_g: 2.6, porcion: '100 g cocidos', beneficio: 'Fibra y proteína', origen_andino: false },
    { nombre: 'Pescado enlatado', categoria: 'despensa', kcal: 200, proteina_g: 24, carbohidratos_g: 0, grasa_g: 11, porcion: '100 g', beneficio: 'Omega-3 y proteína', origen_andino: false },
    { nombre: 'Huevo en polvo', categoria: 'despensa', kcal: 155, proteina_g: 13, carbohidratos_g: 1, grasa_g: 11, porcion: '2 cdas', beneficio: 'Proteína completa', origen_andino: false },
    { nombre: 'Fruta liofilizada', categoria: 'despensa', kcal: 90, proteina_g: 1, carbohidratos_g: 22, grasa_g: 0, porcion: '30 g', beneficio: 'Vitaminas y antioxidantes', origen_andino: false },
    { nombre: 'Avena', categoria: 'despensa', kcal: 150, proteina_g: 5, carbohidratos_g: 27, grasa_g: 3, porcion: '40 g', beneficio: 'Fibra y energía sostenida', origen_andino: false },
    { nombre: 'Leche en polvo', categoria: 'despensa', kcal: 120, proteina_g: 8, carbohidratos_g: 12, grasa_g: 3, porcion: '30 g', beneficio: 'Calcio y proteína', origen_andino: false },
  ]
  for (const a of alimentos) {
    const [alimento] = await Alimento.findOrCreate({ where: { nombre: a.nombre }, defaults: a })
    if (a.nombre === 'Maca') {
      await Contramedida.findOrCreate({ where: { alimento_id: alimento.id, objetivo: 'Densidad ósea y resistencia' }, defaults: { dosis_texto: '3 g/día', via: 'oral' } })
    }
    if (a.nombre === 'Quinua') {
      await Contramedida.findOrCreate({ where: { alimento_id: alimento.id, objetivo: 'Proteína completa muscular' }, defaults: { dosis_texto: '100-150 g/día', via: 'oral' } })
    }
    if (a.nombre === 'Muña') {
      await Contramedida.findOrCreate({ where: { alimento_id: alimento.id, objetivo: 'Alivio digestivo' }, defaults: { dosis_texto: 'Infusión 5 g ×2', via: 'infusión' } })
    }
  }

  // Umbrales clínicos iniciales.
  const umbrales = [
    { parametro: 'saturacion_oxigeno', min_normal: 95, max_normal: 100, min_critico: 90, max_critico: 100, unidad: '%' },
    { parametro: 'frecuencia_cardiaca', min_normal: 60, max_normal: 100, min_critico: 40, max_critico: 150, unidad: 'lpm' },
    { parametro: 'temperatura', min_normal: 36, max_normal: 37.5, min_critico: 34, max_critico: 40, unidad: '°C' },
    { parametro: 'phq9', min_normal: 0, max_normal: 9, min_critico: 20, max_critico: 27, unidad: 'puntos' },
    { parametro: 'glucosa', min_normal: 70, max_normal: 100, min_critico: 54, max_critico: 250, unidad: 'mg/dL' },
  ]
  for (const u of umbrales) {
    await UmbralClinico.findOrCreate({ where: { parametro: u.parametro }, defaults: u })
  }

  // Configuración de IA (modo nube desactivado hasta consentimiento).
  await ConfiguracionIA.findOrCreate({
    where: { proveedor: 'gemini' },
    defaults: {
      proveedor: 'gemini',
      modelo: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
      activo: false,
      limite_diario_por_usuario: 50,
      limite_mensual_global: 10000,
      version_prompt_sistema: 'v1',
    },
  })
}

/**
 * Siembra el escenario de demostración de 120 días con tendencias realistas
 * (sueño que empeora, frecuencia cardíaca que sube, ánimo que cae, ejercicio que
 * baja). Solo se ejecuta en modo demo y una única vez (si ya hay registros, no
 * resiembra). Incluye signos vitales, sueño, ánimo, glucosa, ejercicio, estado
 * conductual y alertas, para que el dashboard, el mapa corporal y el historial
 * tengan datos con los que probar.
 * @param {object} params - Modelos y tripulantes.
 * @returns {Promise<void>} Promesa.
 */
async function sembrarEscenarioDemo({ ana, diego, lucia, Registro, SignoVital, RegistroSueno, RegistroGlucosa, RegistroAnimo, RegistroEjercicio, RegistroEstadoConductual, AccionSalud, Alerta }) {
  if (await Registro.count() > 0) return

  const { Usuario } = modelos
  const admin = await Usuario.findOne({ where: { email: 'admin@ayni.health' } })

  /** Crea una cabecera + detalle con código único y fecha en el pasado. */
  const crear = async (tripulante, tipo, detalle, modeloDetalle, diasAtras) => {
    const registro = await Registro.create({
      codigo: randomBytes(4).toString('hex').toUpperCase(),
      usuario_id: admin?.id ?? null,
      tripulante_id: tripulante.id,
      tipo,
      estado: 'validado',
      fecha_registro: new Date(Date.now() - diasAtras * 86400000),
    })
    await modeloDetalle.create({ registro_id: registro.id, ...detalle })
    return registro
  }

  // 16 puntos a lo largo de 120 días (más densos en las últimas dos semanas).
  const DIAS = [120, 105, 90, 75, 60, 45, 30, 21, 14, 10, 7, 5, 3, 2, 1, 0]
  const n = DIAS.length

  /** Interpola linealmente entre inicio y fin según el índice. */
  const interpolar = (inicio, fin, i) => inicio + ((fin - inicio) * (i / (n - 1)))

  // Perfil por persona (variación individual).
  const perfiles = [
    { tripulante: ana, factor: 1.0, alerta: 'Sueño insuficiente y ánimo bajo: priorizar higiene del sueño.' },
    { tripulante: diego, factor: 1.08, alerta: 'Frecuencia cardíaca en reposo elevada: revisar carga de entrenamiento.' },
    { tripulante: lucia, factor: 0.94, alerta: 'Leve aumento de estrés: programar apoyo psicológico.' },
  ]

  for (const { tripulante, factor, alerta } of perfiles) {
    for (let i = 0; i < n; i += 1) {
      const d = DIAS[i]

      // Signos vitales: FC sube, SpO₂ baja, presión y temperatura estables.
      await crear(tripulante, 'signos_vitales', {
        frecuencia_cardiaca: Math.round(interpolar(66, 94, i) * factor),
        spo2: Number(interpolar(98.5, 93.5, i).toFixed(1)),
        presion_sistolica: Math.round(interpolar(118, 128, i)),
        presion_diastolica: Math.round(interpolar(76, 82, i)),
        temperatura_c: Number(interpolar(36.5, 36.9, i).toFixed(1)),
      }, SignoVital, d)

      // Sueño: horas y calidad bajan, despertares suben.
      await crear(tripulante, 'sueno', {
        horas: Number(interpolar(8.2, 5.6, i).toFixed(1)),
        calidad: Math.round(interpolar(9, 5, i)),
        despertares: Math.round(interpolar(1, 4, i)),
      }, RegistroSueno, d)

      // Ánimo: baja.
      await crear(tripulante, 'animo', { escala: Math.round(interpolar(9, 4, i)) }, RegistroAnimo, d)

      // Ejercicio: minutos bajan y el plan se cumple menos.
      await crear(tripulante, 'ejercicio', {
        tipo: i % 2 === 0 ? 'resistencia' : 'cardio',
        minutos: Math.round(interpolar(45, 15, i) * factor),
        cumplio_plan: i < n - 4,
      }, RegistroEjercicio, d)

      // Glucosa: estable con variación ligera.
      await crear(tripulante, 'glucosa', { glucosa_mgdl: Math.round(interpolar(92, 96, i) + (i % 3)), ayunas: true }, RegistroGlucosa, d)

      // Estado conductual: GAD-7, estrés y fatiga suben.
      await crear(tripulante, 'estado_conductual', {
        gad7: Math.round(interpolar(2, 9, i) * factor),
        estres: Math.round(interpolar(2, 7, i)),
        fatiga: Math.round(interpolar(2, 7, i)),
      }, RegistroEstadoConductual, d)
    }

    // Una alerta activa por tripulante (para notificaciones y badge).
    await Alerta.findOrCreate({
      where: { tripulante_id: tripulante.id, mensaje: alerta },
      defaults: { severidad: 'atencion', estado: 'nueva' },
    })
  }

  // Acciones de salud sugeridas por las reglas.
  await AccionSalud.findOrCreate({
    where: { tripulante_id: ana.id, dominio: 'conductual', descripcion: 'Higiene del sueño y apoyo psicológico', origen: 'regla' },
    defaults: { estado: 'pendiente', fecha: new Date() },
  })
  await AccionSalud.findOrCreate({
    where: { tripulante_id: ana.id, dominio: 'oseo', descripcion: 'Aumentar ejercicio de resistencia (20-30 min/día)', origen: 'regla' },
    defaults: { estado: 'pendiente', fecha: new Date() },
  })
}
