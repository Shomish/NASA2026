/**
 * @fileoverview Servicios de aplicación: puntaje, nutrición personalizada y chatbot.
 * @module aplicacion/indice
 */

import { evaluarSignoVital, CATALOGO_CONDICIONES, calcularIMC } from '../dominio/indice.js'
import { contramedidasAndinas, despensaGlobal } from '../datos/mockDatos.js'

/**
 * Calcula el puntaje compuesto de salud (0-100).
 * @param {object} signos - Signos vitales actuales.
 * @returns {{puntaje: number, nivel: 'optimo'|'atencion'|'critico', desglose: object}} Resultado.
 */
export function calcularPuntajeSalud(signos) {
  const tipos = ['sistolica', 'diastolica', 'saturacion_oxigeno', 'masa_corporal', 'temperatura']
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
 * Motor del chatbot (local): genera respuestas contextuales según la persona y sus datos.
 * @param {string} texto - Mensaje del usuario.
 * @param {object} contexto - Contexto (persona, signos, historial).
 * @returns {string} Respuesta del asistente.
 */
export function responderChatbot(texto, contexto) {
  const { persona, signos = {}, sueno = null, mental = null, nutricion = null } = contexto
  // Normaliza: minúsculas y sin tildes para un matching robusto.
  const t = (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const nombre = persona?.nombre ?? 'tripulante'

  if (!persona) return 'No hay una persona seleccionada. Ve a Tripulación y elige un astronauta.'

  // Intenciones específicas primero (orden de prioridad).
  if (/(comer|nutri|dieta|aliment|recomienda|superalimento|andino|plan)/.test(t)) {
    return generarResumenNutricion(persona, nutricion)
  }
  if (/(sueno|dormir|dormi|descanso|insomnio|circadiano)/.test(t)) {
    return sueno
      ? `Registro de sueño: ${sueno.horas}h con calidad ${sueno.calidad}/10 y ${sueno.interrupciones} despertares. ${sueno.horas >= 6.5 ? 'Dentro del rango recomendado.' : 'Por debajo de lo recomendado; sugiero regular el ciclo circadiano y una infusión de muña antes de dormir.'}`
      : `${nombre}, aún no registras sueño. Registra tus horas de descanso para que pueda evaluarlas.`
  }
  if (/(mental|animo|estres|ansiedad|depresion|phq|gad)/.test(t)) {
    return mental
      ? `Tu última evaluación ${mental.cuestionario === 'phq9' ? 'PHQ-9' : 'GAD-7'} fue ${mental.puntaje} puntos. ${mental.puntaje >= 10 ? 'Recomiendo apoyo psicológico de tripulación (ayni).' : 'Dentro de rangos manejables.'}`
      : `${nombre}, no hay evaluación de salud mental reciente. Te recomiendo completar el PHQ-9 o GAD-7.`
  }
  if (/(riesgo|peligro|alerta|anomalo|problema|critico)/.test(t)) {
    return generarResumenRiesgos(persona, signos)
  }
  if (/(quien|perfil|edad|peso|datos|informacion|soy)/.test(t)) {
    return `${nombre} (${persona.rol}), ${persona.edad} años, ${persona.pesoKg} kg, IMC ${calcularIMC(persona.pesoKg, persona.alturaCm)}. Misión: ${persona.mision}, día ${persona.diaMision}. Objetivo: ${persona.objetivoSalud || 'sin objetivo definido'}.`
  }

  // Respuesta por defecto: resumen de salud.
  return generarResumenSalud(persona, signos)
}

/**
 * Genera un resumen de salud contextual.
 * @param {object} persona - Astronauta.
 * @param {object} signos - Signos vitales.
 * @returns {string} Resumen.
 */
function generarResumenSalud(persona, signos) {
  const resultado = calcularPuntajeSalud(signos)
  const nivelTexto = { optimo: 'óptimo', atencion: 'requiere atención', critico: 'crítico' }[resultado.nivel]
  const anomalos = Object.entries(resultado.desglose).filter(([, estado]) => estado !== 'optimo')
  const detalleAnomalos = anomalos.length
    ? ` Detecté ${anomalos.length} indicador(es) fuera de rango.`
    : ' Todos los indicadores vitales dentro de rango nominal.'

  return `Hola ${persona.nombre}. Tu puntaje de salud es ${resultado.puntaje}/100 (${nivelTexto}).${detalleAnomalos} ${persona.condiciones?.length ? `Considerando tus condiciones (${persona.condiciones.join(', ')}), mantén el protocolo de contramedidas.` : ''}`
}

/**
 * Genera un resumen nutricional.
 * @param {object} persona - Astronauta.
 * @param {object} nutricion - Recomendación nutricional.
 * @returns {string} Resumen.
 */
function generarResumenNutricion(persona, nutricion) {
  if (!nutricion || nutricion.contramedidas.length === 0) {
    return `${persona.nombre}, aún no genero tu plan nutricional personalizado. Asegúrate de tener un perfil con condiciones definidas.`
  }
  return `${persona.nombre}, según tu perfil recomiendo: ${nutricion.contramedidas.map((c) => `${c.nombre} (${c.beneficio})`).join(', ')}. Dosis sugeridas: ${nutricion.contramedidas.map((c) => `${c.nombre} ${c.dosis}`).join('; ')}.`
}

/**
 * Genera un resumen de riesgos.
 * @param {object} persona - Astronauta.
 * @param {object} signos - Signos vitales.
 * @returns {string} Resumen.
 */
function generarResumenRiesgos(persona, signos) {
  const criticos = Object.entries(signos ?? {})
    .filter(([tipo, valor]) => evaluarSignoVital(tipo, valor) === 'critico')
    .map(([tipo]) => tipo)
  const condiciones = persona.condiciones ?? []

  if (criticos.length === 0 && condiciones.length === 0) {
    return `${persona.nombre}, no detecto riesgos críticos en tus signos vitales ni condiciones de alto riesgo. Continúa el monitoreo.`
  }
  const partes = []
  if (criticos.length) partes.push(`indicadores críticos: ${criticos.join(', ')}`)
  if (condiciones.length) partes.push(`condiciones de riesgo: ${condiciones.join(', ')}`)
  return `${persona.nombre}, atención a los siguientes riesgos: ${partes.join(' y ')}. Recomiendo aplicar las contramedidas correspondientes.`
}
