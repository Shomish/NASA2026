/**
 * @fileoverview Servicios de aplicación: puntaje, nutrición personalizada y chatbot.
 * @module aplicacion/indice
 */

import { evaluarSignoVital, CATALOGO_CONDICIONES, calcularIMC } from '../dominio/indice.js'
import { contramedidasAndinas, despensaGlobal } from '../datos/mockDatos.js'
import { idiomaActual } from '../shared/idioma.js'
import { PROTOCOLO_EMERGENCIA, detectarEmergencia } from '../../shared/emergencia.js'
import { AVISO_LEGAL, respuestaLocal } from '../../shared/chatLocal.js'

/**
 * Calcula el puntaje compuesto de salud (0-100).
 * @param {object} signos - Signos vitales actuales.
 * @returns {{puntaje: number, nivel: 'optimo'|'atencion'|'critico', desglose: object}} Resultado.
 */
export function calcularPuntajeSalud(signos) {
  const tipos = ['sistolica', 'diastolica', 'saturacion_oxigeno', 'frecuencia_cardiaca', 'temperatura']
  const desglose = {}
  let suma = 0
  let contador = 0

  for (const tipo of tipos) {
    const valor = signos?.[tipo]
    if (valor === null || valor === undefined) continue
    const estado = evaluarSignoVital(tipo, valor)
    desglose[tipo] = estado
    suma += estado === 'optimo' ? 100 : estado === 'atencion' ? 70 : 35
    contador += 1
  }

  if (contador === 0) return { puntaje: 0, nivel: 'critico', desglose }

  const puntaje = Math.round(suma / contador)
  const nivel = puntaje >= 80 ? 'optimo' : puntaje >= 60 ? 'atencion' : 'critico'
  return { puntaje, nivel, desglose }
}

/**
 * Genera la recomendación nutricional personalizada según el perfil del astronauta.
 * @param {import('../dominio/indice.js').Astronauta} persona - Astronauta.
 * @param {object} signos - Signos vitales actuales.
 * @returns {{contramedidas: object[], raciones: object[], resumen: string}} Recomendación.
 */
export function generarRecomendacionNutricional(persona, signos = {}) {
  if (!persona) return { contramedidas: [], raciones: [], resumen: '' }

  // 1. Contramedidas andinas según condiciones del perfil.
  const idsRecomendados = new Set()
  for (const condicion of persona.condiciones ?? []) {
    const catalogo = CATALOGO_CONDICIONES.find((c) => c.id === condicion)
    catalogo?.recomendado.forEach((id) => idsRecomendados.add(id))
  }

  // 2. Auto-generación adicional según signos vitales actuales (datos atípicos).
  if (signos?.saturacion_oxigeno != null && Number(signos.saturacion_oxigeno) < 95) {
    idsRecomendados.add('coca')
    idsRecomendados.add('cushuro')
  }
  if (signos?.frecuencia_cardiaca != null && Number(signos.frecuencia_cardiaca) > 100) {
    idsRecomendados.add('muna')
    idsRecomendados.add('maca')
  }
  if (signos?.temperatura != null && Number(signos.temperatura) > 37.5) {
    idsRecomendados.add('camu_camu')
  }

  // Filtrar por alergias (contramedidas con el mismo id de alérgeno).
  const alergias = new Set((persona.alergias ?? []).map((a) => a.toLowerCase()))
  const contramedidas = contramedidasAndinas
    .filter((c) => idsRecomendados.has(c.id))
    .filter((c) => !alergias.has(c.nombre.toLowerCase()))

  // 2. Raciones según IMC y signos.
  const imc = calcularIMC(persona.pesoKg, persona.alturaCm)
  const raciones = []
  if (imc < 20 || signos?.masa_corporal < persona.pesoKg * 0.9) {
    raciones.push(despensaGlobal.find((d) => d.id === 'barra_proteina'))
    raciones.push(despensaGlobal.find((d) => d.id === 'pollo_termo'))
  }
  if (imc > 27) {
    raciones.push(despensaGlobal.find((d) => d.id === 'verduras'))
    raciones.push(despensaGlobal.find((d) => d.id === 'salmon_liof'))
  }
  if (raciones.length === 0) {
    raciones.push(despensaGlobal.find((d) => d.id === 'arroz'))
    raciones.push(despensaGlobal.find((d) => d.id === 'verduras'))
  }

  const resumen =
    contramedidas.length > 0
      ? `Plan personalizado para ${persona.nombre} (IMC ${imc}): ${contramedidas.map((c) => c.nombre).join(', ')}.`
      : `Plan base para ${persona.nombre} (IMC ${imc}): mantener dieta equilibrada de misión.`

  return { contramedidas, raciones: raciones.filter(Boolean), resumen }
}

/**
 * Responde localmente y añade el aviso legal a toda respuesta no urgente.
 * @param {string} texto - Mensaje del usuario.
 * @param {object} [contexto] - Contexto.
 * @returns {string} Respuesta.
 */
export function responderChatbot(texto, contexto = {}) {
  const idioma = idiomaActual() === 'en' ? 'en' : 'es'
  const emergencia = detectarEmergencia(texto, contexto?.signos ?? {})
  if (emergencia.emergencia) return PROTOCOLO_EMERGENCIA
  const base = responderChatbotInterno(texto, contexto)
  return `${base}\n\n${AVISO_LEGAL[idioma]}`
}

/**
 * Motor del chatbot (local): genera respuestas contextuales según la persona y sus datos.
 * Funciona sin conexión y respeta el idioma actual (es/en) de la interfaz.
 * @param {string} texto - Mensaje del usuario.
 * @param {object} contexto - Contexto (persona, signos, historial).
 * @returns {string} Respuesta del asistente.
 */
function responderChatbotInterno(texto, contexto = {}) {
  const { persona, signos = {}, sueno = null, mental = null, nutricion = null } = contexto
  // Normaliza: minúsculas y sin tildes para un matching robusto.
  const t = (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const nombre = persona?.nombre ?? 'tripulante'
  const idioma = idiomaActual() === 'en' ? 'en' : 'es'
  const en = idioma === 'en'

  if (!persona) {
    return en
      ? 'There is no selected crew member. Go to Crew and choose an astronaut.'
      : 'No hay una persona seleccionada. Ve a Tripulación y elige un astronauta.'
  }

  // Saludo / ayuda.
  if (/(hola|buenas|hello|hi|help|ayuda|que puedes|what can)/.test(t)) {
    return en
      ? `Hello ${nombre}, I'm your AI doctor. I can help with nutrition, sleep, mental health and risks. Ask me things like "how is my health?" or "what should I eat?".`
      : `Hola ${nombre}, soy tu médico de IA. Puedo ayudarte con nutrición, sueño, salud mental y riesgos. Pregúntame cosas como "¿cómo está mi salud?" o "¿qué debo comer?".`
  }

  // Análisis completo (signos + sueño + salud mental + nutrición).
  if (/(analiz|resumen|completo|general|todo|evaluacion|overall|full|summary|assessment)/.test(t)) {
    const resultado = calcularPuntajeSalud(signos)
    const nivel = en
      ? { optimo: 'optimal', atencion: 'needs attention', critico: 'critical' }[resultado.nivel]
      : { optimo: 'óptimo', atencion: 'requiere atención', critico: 'crítico' }[resultado.nivel]
    const parteSueno = sueno
      ? (en ? ` Sleep: ${sueno.horas}h, quality ${sueno.calidad}/10.` : ` Sueño: ${sueno.horas}h, calidad ${sueno.calidad}/10.`)
      : (en ? ' No sleep data yet.' : ' Aún sin datos de sueño.')
    const parteMental = mental
      ? (en ? ` Mental health: ${mental.cuestionario?.toUpperCase?.() ?? 'PHQ-9'} ${mental.puntaje} pts.` : ` Salud mental: ${mental.cuestionario?.toUpperCase?.() ?? 'PHQ-9'} ${mental.puntaje} pts.`)
      : (en ? ' No mental health data yet.' : ' Aún sin evaluación de salud mental.')
    const parteNutricion = nutricion?.contramedidas?.length
      ? (en ? ` Nutrition: ${nutricion.contramedidas.map((c) => c.nombre).join(', ')}.` : ` Nutrición: ${nutricion.contramedidas.map((c) => c.nombre).join(', ')}.`)
      : (en ? ' No personalized nutrition plan yet.' : ' Aún sin plan nutricional personalizado.')
    return en
      ? `${nombre}, here is your full analysis: Indicative health index ${resultado.puntaje}/100 (${nivel}).${parteSueno}${parteMental}${parteNutricion}`
      : `${nombre}, aquí va tu análisis completo: Índice orientativo de salud ${resultado.puntaje}/100 (${nivel}).${parteSueno}${parteMental}${parteNutricion}`
  }

  const local = respuestaLocal(texto, idioma)
  if (['sintomas', 'alimentacion', 'sueno', 'animo'].includes(local.intencion)) return local.texto

  // Intenciones específicas primero (orden de prioridad).
  if (/(comer|nutri|dieta|aliment|recomienda|superalimento|andino|plan|food|diet|eat|meal)/.test(t)) {
    return generarResumenNutricion(persona, nutricion, en)
  }
  if (/(sueno|dormir|dormi|descanso|insomnio|circadiano|sleep|rest)/.test(t)) {
    if (sueno) {
      const dentro = sueno.horas >= 7
      return en
        ? `Sleep record: ${sueno.horas}h with quality ${sueno.calidad}/10 and ${sueno.interrupciones} awakenings. ${dentro ? 'Within the recommended range.' : 'Below the recommendation; I suggest regulating your circadian cycle and a muña infusion before bed.'}`
        : `Registro de sueño: ${sueno.horas}h con calidad ${sueno.calidad}/10 y ${sueno.interrupciones} despertares. ${dentro ? 'Dentro del rango recomendado.' : 'Por debajo de lo recomendado; sugiero regular el ciclo circadiano y una infusión de muña antes de dormir.'}`
    }
    return en
      ? `${nombre}, aim for 7 hours or more (Watson et al., 2015). Keep a regular routine, avoid caffeine and screens before bed, and record your sleep in the app.`
      : `${nombre}, apunta a 7 horas o más (Watson et al., 2015). Mantén una rutina regular, evita cafeína y pantallas antes de dormir, y registra tu sueño en la app.`
  }
  if (/(mental|animo|estres|ansiedad|depresion|phq|gad|mood|stress|anxiety|depression)/.test(t)) {
    if (mental) {
      const alto = (mental.puntaje ?? 0) >= 10
      return en
        ? `Your last ${mental.cuestionario === 'phq9' ? 'PHQ-9' : 'GAD-7'} assessment was ${mental.puntaje} points. ${alto ? 'I recommend crew psychological support (ayni).' : 'Within manageable ranges.'}`
        : `Tu última evaluación ${mental.cuestionario === 'phq9' ? 'PHQ-9' : 'GAD-7'} fue ${mental.puntaje} puntos. ${alto ? 'Recomiendo apoyo psicológico de tripulación (ayni).' : 'Dentro de rangos manejables.'}`
    }
    return en
      ? `${nombre}, there is no recent mental health assessment. I recommend completing the PHQ-9 or GAD-7.`
      : `${nombre}, no hay evaluación de salud mental reciente. Te recomiendo completar el PHQ-9 o GAD-7.`
  }
  if (/(riesgo|peligro|alerta|anomalo|problema|critico|risk|danger|alert|abnormal|problem)/.test(t)) {
    return generarResumenRiesgos(persona, signos, en)
  }
  if (/(quien|perfil|edad|peso|datos|informacion|soy|who|profile|age|weight|data|info)/.test(t)) {
    return en
      ? `${nombre} (${persona.rol}), ${persona.edad} years old, ${persona.pesoKg} kg, BMI ${calcularIMC(persona.pesoKg, persona.alturaCm)}. Mission: ${persona.mision}, day ${persona.diaMision}. Goal: ${persona.objetivoSalud || 'no goal defined'}.`
      : `${nombre} (${persona.rol}), ${persona.edad} años, ${persona.pesoKg} kg, IMC ${calcularIMC(persona.pesoKg, persona.alturaCm)}. Misión: ${persona.mision}, día ${persona.diaMision}. Objetivo: ${persona.objetivoSalud || 'sin objetivo definido'}.`
  }
  if (/(agua|hidrat|water|hydrat)/.test(t)) {
    return en
      ? `${nombre}, stay hydrated with 2.5–3 L of water per day, more during high-activity days. Dehydration worsens radiation and fatigue effects.`
      : `${nombre}, mantente hidratado con 2.5–3 L de agua al día, más en días de alta actividad. La deshidratación agrava los efectos de la radiación y la fatiga.`
  }
  if (/(ejercicio|entren|exercise|train|workout)/.test(t)) {
    return en
      ? `${nombre}, keep ~30 min of daily exercise (resistance + cardio). It protects muscle and bone mass in microgravity.`
      : `${nombre}, mantén ~30 min de ejercicio diario (resistencia + cardio). Protege la masa muscular y ósea en microgravedad.`
  }

  // Resumen de salud si el usuario lo pide explícitamente.
  if (/(salud|health|estado|status|como estoy|how am i)/.test(t)) {
    return generarResumenSalud(persona, signos, en)
  }

  // Respuesta por defecto: intenciones locales.
  return respuestaLocal(texto, idioma).texto
}

/** Nombres legibles de los signos para el análisis offline. */
const NOMBRES_SIGNO = {
  sistolica: { es: 'presión sistólica', en: 'systolic pressure' },
  diastolica: { es: 'presión diastólica', en: 'diastolic pressure' },
  saturacion_oxigeno: { es: 'saturación de O₂', en: 'O₂ saturation' },
  masa_corporal: { es: 'masa corporal', en: 'body mass' },
  temperatura: { es: 'temperatura', en: 'temperature' },
}

/**
 * Genera un resumen de salud contextual con desglose por indicador.
 * @param {object} persona - Astronauta.
 * @param {object} signos - Signos vitales.
 * @param {boolean} [en] - Si responde en inglés.
 * @returns {string} Resumen.
 */
function generarResumenSalud(persona, signos, en = false) {
  const resultado = calcularPuntajeSalud(signos)
  const nivelTexto = en
    ? { optimo: 'optimal', atencion: 'needs attention', critico: 'critical' }[resultado.nivel]
    : { optimo: 'óptimo', atencion: 'requiere atención', critico: 'crítico' }[resultado.nivel]
  const anomalos = Object.entries(resultado.desglose).filter(([, estado]) => estado !== 'optimo')

  // Desglose por indicador.
  const lineas = Object.entries(resultado.desglose).map(([tipo, estado]) => {
    const nombre = en ? NOMBRES_SIGNO[tipo]?.en ?? tipo : NOMBRES_SIGNO[tipo]?.es ?? tipo
    const valor = signos?.[tipo]
    const estadoTexto = en
      ? { optimo: 'ok', atencion: 'watch', critico: 'critical' }[estado]
      : { optimo: 'óptimo', atencion: 'atención', critico: 'crítico' }[estado]
    return `${nombre} ${valor} (${estadoTexto})`
  })

  const detalleAnomalos = anomalos.length
    ? en
      ? ` ${anomalos.length} out-of-range indicator(s).`
      : ` ${anomalos.length} indicador(es) fuera de rango.`
    : en
      ? ' All vital indicators within nominal range.'
      : ' Todos los indicadores vitales dentro de rango nominal.'

  const condicion = persona.condiciones?.length
    ? en
      ? ` Considering your conditions (${persona.condiciones.join(', ')}), keep the countermeasure protocol.`
      : ` Considerando tus condiciones (${persona.condiciones.join(', ')}), mantén el protocolo de contramedidas.`
    : ''

  const prefijo = en ? 'Hello' : 'Hola'
  const desglose = en ? 'Indicators:' : 'Indicadores:'

  return `${prefijo} ${persona.nombre}. ${en ? 'Your indicative health index' : 'Tu índice orientativo de salud'} ${resultado.puntaje}/100 (${nivelTexto}).${detalleAnomalos}\n${desglose} ${lineas.join(' · ')}${condicion}`
}

/**
 * Genera un resumen nutricional.
 * @param {object} persona - Astronauta.
 * @param {object} nutricion - Recomendación nutricional.
 * @param {boolean} [en] - Si responde en inglés.
 * @returns {string} Resumen.
 */
function generarResumenNutricion(persona, nutricion, en = false) {
  if (!nutricion || nutricion.contramedidas.length === 0) {
    return en
      ? `${persona.nombre}, I haven't generated your personalized nutrition plan yet. Make sure your profile has defined conditions.`
      : `${persona.nombre}, aún no genero tu plan nutricional personalizado. Asegúrate de tener un perfil con condiciones definidas.`
  }
  return en
    ? `${persona.nombre}, based on your profile I recommend: ${nutricion.contramedidas.map((c) => `${c.nombre} (${c.beneficio})`).join(', ')}. Suggested doses: ${nutricion.contramedidas.map((c) => `${c.nombre} ${c.dosis}`).join('; ')}.`
    : `${persona.nombre}, según tu perfil recomiendo: ${nutricion.contramedidas.map((c) => `${c.nombre} (${c.beneficio})`).join(', ')}. Dosis sugeridas: ${nutricion.contramedidas.map((c) => `${c.nombre} ${c.dosis}`).join('; ')}.`
}

/**
 * Genera un resumen de riesgos.
 * @param {object} persona - Astronauta.
 * @param {object} signos - Signos vitales.
 * @param {boolean} [en] - Si responde en inglés.
 * @returns {string} Resumen.
 */
function generarResumenRiesgos(persona, signos, en = false) {
  const criticos = Object.entries(signos ?? {})
    .filter(([tipo, valor]) => evaluarSignoVital(tipo, valor) === 'critico')
    .map(([tipo]) => tipo)
  const condiciones = persona.condiciones ?? []

  if (criticos.length === 0 && condiciones.length === 0) {
    return en
      ? `${persona.nombre}, I don't detect critical risks in your vital signs or high-risk conditions. Continue monitoring.`
      : `${persona.nombre}, no detecto riesgos críticos en tus signos vitales ni condiciones de alto riesgo. Continúa el monitoreo.`
  }
  const partes = []
  if (criticos.length) partes.push(en ? `critical indicators: ${criticos.join(', ')}` : `indicadores críticos: ${criticos.join(', ')}`)
  if (condiciones.length) partes.push(en ? `risk conditions: ${condiciones.join(', ')}` : `condiciones de riesgo: ${condiciones.join(', ')}`)
  return en
    ? `${persona.nombre}, attention to the following risks: ${partes.join(' and ')}. I recommend applying the corresponding countermeasures.`
    : `${persona.nombre}, atención a los siguientes riesgos: ${partes.join(' y ')}. Recomiendo aplicar las contramedidas correspondientes.`
}
