/**
 * @fileoverview Datos clínicos y científicos compartidos por la siembra y las migraciones.
 * Centraliza umbrales, catálogo de indicadores y consejos por entorno para que
 * `npm run db:setup`, `npm run db:migrate` y las bases existentes queden alineados.
 * @module server/db/datosClinicos
 */

import { modelos } from './modelos.js'

/** Umbrales clínicos finales (normal / crítico). */
export const UMBRALES_DEFECTO = [
  { parametro: 'saturacion_oxigeno', min_normal: 95, max_normal: 100, min_critico: 90, max_critico: 100, unidad: '%' },
  { parametro: 'frecuencia_cardiaca', min_normal: 60, max_normal: 100, min_critico: 40, max_critico: 150, unidad: 'lpm' },
  { parametro: 'temperatura', min_normal: 36, max_normal: 37.5, min_critico: 34, max_critico: 100, unidad: '°C' },
  { parametro: 'phq9', min_normal: 0, max_normal: 9, min_critico: 20, max_critico: 27, unidad: 'puntos' },
  { parametro: 'glucosa', min_normal: 70, max_normal: 99, min_critico: 54, max_critico: 250, unidad: 'mg/dL' },
  { parametro: 'presion_sistolica', min_normal: 90, max_normal: 120, min_critico: 0, max_critico: 180, unidad: 'mmHg' },
  { parametro: 'presion_diastolica', min_normal: 60, max_normal: 80, min_critico: 0, max_critico: 120, unidad: 'mmHg' },
  { parametro: 'radiacion_acumulada', min_normal: 0, max_normal: 479, min_critico: 0, max_critico: 599.99, unidad: 'mSv' },
  { parametro: 'radiacion_evento', min_normal: 0, max_normal: 249, min_critico: 0, max_critico: 249.99, unidad: 'mSv' },
  { parametro: 'sueno', min_normal: 7, max_normal: 24, min_critico: 0, max_critico: 24, unidad: 'h' },
]

/** Catálogo de indicadores con fuente y estado de verificación. */
export const INDICADORES_CATALOGO = [
  {
    nombre: 'Presión arterial',
    unidad: 'mmHg',
    rango_referencia: '< 120/80 normal; 120–139/80–89 ámbar; ≥ 140/90 alerta; > 180/120 crisis',
    peligro_asociado: 'cardiovascular',
    como_medir: 'Con un tensiómetro, en reposo, sentado y con el brazo a la altura del corazón. Repite la medición si el valor es alto.',
    por_que: 'Detecta cambios cardiovasculares por la microgravedad, el estrés y el desacondicionamiento.',
    como_afecta: 'La microgravedad desplaza líquidos hacia la parte superior del cuerpo y puede alterar la presión.',
    cuando_escalar: 'Si es ≥ 140/90, repite la medición y avisa al oficial médico. Si supera 180/120, activa el protocolo de emergencia.',
    acciones_preventivas: 'Ejercicio aeróbico diario, hidratación, control del sodio y manejo del estrés.',
    fuente: 'American Heart Association (AHA). Criterio del equipo para la medición.',
    estado_verificacion: 'verificado',
  },
  {
    nombre: 'Frecuencia cardíaca',
    unidad: 'lpm',
    rango_referencia: '60–100 normal; < 40 o > 150 crítico',
    peligro_asociado: 'cardiovascular',
    como_medir: 'Con un pulsómetro de muñeca o monitor de pecho, en reposo. También puedes contar el pulso radial durante 60 segundos.',
    por_que: 'Refleja la carga cardiovascular, el estrés y el estado físico.',
    como_afecta: 'El desacondicionamiento y el estrés pueden elevar la frecuencia en reposo.',
    cuando_escalar: 'Avisa si supera 150 lpm o baja de 40 lpm, o si hay mareo, dolor de pecho o falta de aire.',
    acciones_preventivas: 'Entrenamiento aeróbico y de resistencia, sueño adecuado y manejo del estrés.',
    fuente: 'American Heart Association (AHA). Rangos críticos: criterio del equipo.',
    estado_verificacion: 'verificado',
  },
  {
    nombre: 'Saturación de oxígeno',
    unidad: '%',
    rango_referencia: '≥ 95 normal; 90–94 atención; < 90 crítico',
    peligro_asociado: 'hipoxia',
    como_medir: 'Con un pulsioxímetro en el dedo, en reposo y sin moverse durante un minuto.',
    por_que: 'Detecta hipoxia y permite actuar antes de que aparezcan síntomas graves.',
    como_afecta: 'La altitud, la hipoxia hipobárica y los cambios pulmonares pueden reducir la saturación.',
    cuando_escalar: 'Avisa si es menor de 90 %. A gran altitud, como Cusco (3 400 m), la saturación normal puede ser menor.',
    acciones_preventivas: 'Descanso, hidratación, aclimatación progresiva y oxígeno suplementario si está indicado.',
    fuente: 'WHO (2016). Nota de altitud: criterio del equipo.',
    estado_verificacion: 'verificado',
  },
  {
    nombre: 'Temperatura corporal',
    unidad: '°C',
    rango_referencia: '36–37.5 normal; ≥ 38 fiebre/alerta; < 34 crítico',
    peligro_asociado: 'inmune',
    como_medir: 'Con un termómetro digital, en reposo. Usa la vía indicada por el fabricante y espera el tiempo recomendado.',
    por_que: 'Detecta fiebre (posible infección) o hipotermia.',
    como_afecta: 'Los cambios inmunes en el espacio pueden favorecer infecciones con fiebre.',
    cuando_escalar: 'Avisa si supera 38 °C o si baja de 34 °C.',
    acciones_preventivas: 'Higiene, sueño adecuado y control del ambiente de cabina.',
    fuente: 'CDC (fiebre ≥ 38 °C). Umbral bajo: criterio del equipo.',
    estado_verificacion: 'verificado',
  },
  {
    nombre: 'Glucosa',
    unidad: 'mg/dL',
    rango_referencia: '70–99 normal en ayunas; 100–125 elevada; < 70 baja; < 54 grave; > 250 crítico',
    peligro_asociado: 'nutricion',
    como_medir: 'Con un glucómetro y una gota de sangre capilar, preferiblemente en ayunas. Sigue las instrucciones del dispositivo.',
    por_que: 'Controla el metabolismo y detecta hipoglucemia o hiperglucemia.',
    como_afecta: 'La dieta espacial y la reducción de actividad pueden alterar los niveles de glucosa.',
    cuando_escalar: 'Avisa si baja de 70 mg/dL, si baja de 54 mg/dL o si supera 250 mg/dL.',
    acciones_preventivas: 'Dieta equilibrada, ejercicio regular y monitoreo según indicación.',
    fuente: 'CDC (hipoglucemia) y ADA (2026, glucosa en ayunas). Criterio del equipo para > 250 mg/dL.',
    estado_verificacion: 'verificado',
  },
  {
    nombre: 'Sueño',
    unidad: 'horas',
    rango_referencia: '≥ 7 h recomendadas',
    peligro_asociado: 'conductual',
    como_medir: 'Registra las horas de sueño y tu percepción de descanso. Anota los despertares.',
    por_que: 'El sueño insuficiente afecta el ánimo, la atención y el rendimiento.',
    como_afecta: 'El entorno cerrado, la luz artificial y el estrés alteran el ciclo de sueño.',
    cuando_escalar: 'Avisa si duermes menos de 7 h varias noches seguidas o si hay insomnio persistente.',
    acciones_preventivas: 'Higiene del sueño: horario fijo, poca luz antes de dormir y evitar cafeína.',
    fuente: 'Watson et al. (2015), AASM/SRS. Alerta por noches consecutivas: criterio del equipo.',
    estado_verificacion: 'verificado',
  },
  {
    nombre: 'Ánimo',
    unidad: 'escala 1-10',
    rango_referencia: 'Sin umbral clínico; autoevaluación',
    peligro_asociado: 'conductual',
    como_medir: 'Autoevalúa tu estado de ánimo en una escala del 1 al 10 cada día. Para una evaluación validada usa el PHQ-9.',
    por_que: 'Ayuda a detectar deterioro conductual, pero no sustituye un cuestionario validado.',
    como_afecta: 'La distancia de la Tierra y el aislamiento pueden bajar el ánimo y aumentar la ansiedad.',
    cuando_escalar: 'Si el ánimo bajo persiste o hay pensamientos de hacerte daño, usa el PHQ-9 y busca apoyo inmediato.',
    acciones_preventivas: 'Apoyo psicológico, comunicación con la tripulación y rutinas de bienestar.',
    fuente: 'Criterio del equipo. La evaluación validada es el PHQ-9 (Kroenke et al., 2001).',
    estado_verificacion: 'verificado',
  },
  {
    nombre: 'PHQ-9',
    unidad: 'puntos',
    rango_referencia: '0–4 mínima; 5–9 leve; 10–14 moderada; 15–19 moderadamente severa; 20–27 severa',
    peligro_asociado: 'conductual',
    como_medir: 'Responde las 9 preguntas de las últimas dos semanas. La pregunta 9 siempre se revisa de forma prioritaria.',
    por_que: 'Es un cuestionario validado para evaluar síntomas depresivos.',
    como_afecta: 'El aislamiento y el confinamiento pueden aumentar el riesgo de depresión.',
    cuando_escalar: 'Cualquier respuesta distinta de "nunca" en la pregunta 9 activa apoyo inmediato. Puntajes altos requieren evaluación del oficial médico.',
    acciones_preventivas: 'Apoyo psicológico, comunicación con la tripulación y rutinas de bienestar.',
    fuente: 'Kroenke et al. (2001); validación en español: Saldivia et al. (2019).',
    estado_verificacion: 'verificado',
  },
  {
    nombre: 'GAD-7',
    unidad: 'puntos',
    rango_referencia: '0–4 mínima; 5–9 leve; 10–14 moderada; 15–21 severa',
    peligro_asociado: 'conductual',
    como_medir: 'Responde las 7 preguntas de las últimas dos semanas.',
    por_que: 'Es un cuestionario validado para evaluar ansiedad generalizada.',
    como_afecta: 'El aislamiento, la incertidumbre y el confinamiento pueden aumentar la ansiedad.',
    cuando_escalar: 'Puntajes moderados o severos requieren evaluación del oficial médico.',
    acciones_preventivas: 'Técnicas de relajación, apoyo psicológico y rutinas de bienestar.',
    fuente: 'Spitzer et al. (2006).',
    estado_verificacion: 'verificado',
  },
  {
    nombre: 'Radiación',
    unidad: 'mSv',
    rango_referencia: 'Acumulada < 480 normal; 480–599 atención; ≥ 600 alerta; evento ≥ 250 alerta',
    peligro_asociado: 'radiacion',
    como_medir: 'Con un dosímetro personal que registra la dosis del periodo y la dosis acumulada.',
    por_que: 'Controla la exposición acumulada a radiación espacial.',
    como_afecta: 'La radiación puede dañar células y elevar el riesgo de enfermedades a largo plazo. En Marte, la dosis absorbida medida por Curiosity fue 180–225 µGy/día (Hassler et al., 2014); no se convierte a mSv.',
    cuando_escalar: 'Avisa si la dosis acumulada llega a 600 mSv o si un evento solar llega a 250 mSv.',
    acciones_preventivas: 'Permanecer en zonas blindadas durante tormentas solares y seguir el protocolo.',
    fuente: 'NASA-STD-3001 Vol. 1 Rev. C (2023); Hassler et al. (2014) para Marte; atención 480–599: criterio del equipo.',
    estado_verificacion: 'verificado',
  },
]

/** Consejos por entorno de misión. */
export const CONSEJOS_ENTORNOS = {
  'Nave en tránsito': [
    'Mantén una rutina diaria de ejercicio de resistencia y cardio para proteger masa muscular y ósea.',
    'Planifica las comunicaciones con la Tierra y reserva tiempo para el descanso y el apoyo psicológico.',
    'Revisa la dosis acumulada de radiación y sigue el protocolo si hay actividad solar.',
  ],
  'Estación orbital': [
    'Sigue el plan de ejercicio y registra los signos vitales antes y después de la actividad.',
    'Controla la exposición solar y usa las zonas protegidas cuando corresponda.',
    'Mantén contacto con la familia y la tripulación para reducir el aislamiento.',
  ],
  Rover: [
    'Planifica cada salida y revisa el pronóstico de clima espacial antes de exponerte.',
    'Protege la piel y los ojos; registra la dosis del evento al regresar.',
    'Hidrátate y vigila la fatiga durante las actividades extravehiculares.',
  ],
  'Base lunar': [
    'Usa las zonas blindadas durante tormentas solares y registra la dosis acumulada.',
    'Controla el polvo lunar y sigue las rutinas de higiene para evitar irritaciones.',
    'Mantén horarios estables de sueño y actividad física.',
  ],
  'Base marciana': [
    'Gestiona el retraso de comunicaciones con planes claros y autonomía de la tripulación.',
    'Controla la radiación y usa las zonas protegidas durante eventos solares.',
    'Mantén la cohesión del equipo y revisa el ánimo con el PHQ-9.',
  ],
  'Análogo terrestre Cusco': [
    'Aclimátate a la altitud de forma progresiva y vigila la saturación de oxígeno.',
    'Mantén una hidratación adecuada y controla la fatiga.',
    'Registra el sueño y el ánimo; la altitud puede alterar ambos.',
  ],
}

/**
 * Crea o actualiza umbrales, catálogo y consejos en la base actual.
 * Es idempotente y se usa desde la siembra y la migración 006.
 * @returns {Promise<{umbrales: number, indicadores: number, entornos: number}>} Conteos.
 */
export async function actualizarDatosClinicos() {
  const { UmbralClinico, CatalogoIndicador, EntornoMision } = modelos

  for (const umbral of UMBRALES_DEFECTO) {
    const [fila] = await UmbralClinico.findOrCreate({ where: { parametro: umbral.parametro }, defaults: umbral })
    await fila.update(umbral)
  }

  for (const indicador of INDICADORES_CATALOGO) {
    const [fila] = await CatalogoIndicador.findOrCreate({ where: { nombre: indicador.nombre }, defaults: indicador })
    await fila.update(indicador)
  }

  let entornos = 0
  for (const [nombre, consejos] of Object.entries(CONSEJOS_ENTORNOS)) {
    const entorno = await EntornoMision.findOne({ where: { nombre } })
    if (entorno) {
      await entorno.update({ consejos })
      entornos += 1
    }
  }

  return { umbrales: UMBRALES_DEFECTO.length, indicadores: INDICADORES_CATALOGO.length, entornos }
}
