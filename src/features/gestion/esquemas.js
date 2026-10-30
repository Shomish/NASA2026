/**
 * @fileoverview Esquemas Zod de los formularios del núcleo (compartidos con el servidor en estructura).
 * @module features/gestion/esquemas
 */

import { z } from 'zod'
import { interpretarPhq9, item9Phq9Positivo, sumarRespuestas } from '../../../shared/evaluaciones.js'

/** Coerce de número opcional: cadena vacía → undefined. */
const numeroOpcional = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
  z.number().optional(),
)

/** Formulario de tripulante (crear/editar). */
export const esquemaTripulante = z.object({
  nombre: z.string().min(2, 'El nombre es obligatorio').max(120),
  cargo: z.string().max(80).optional().default(''),
  edad: numeroOpcional,
  peso_kg: numeroOpcional,
  altura_cm: numeroOpcional,
  dia_mision: numeroOpcional,
  mision: z.string().max(120).optional().default(''),
  objetivo: z.string().max(255).optional().default(''),
  entorno_id: numeroOpcional,
  alergias: z.string().optional().default('').transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [])),
})

/** Formulario de usuario (crear, administrador). */
export const esquemaUsuario = z.object({
  nombre: z.string().min(2, 'El nombre es obligatorio').max(120),
  email: z.string().email('Email inválido').max(190),
  contrasena: z.string().min(8, 'Mínimo 8 caracteres').max(200),
  rol: z.enum(['administrador', 'medico', 'tripulante']),
})

/** Opciones de tipo de registro. */
export const TIPOS_REGISTRO = [
  { id: 'signos_vitales', etiqueta: 'Signos vitales' },
  { id: 'glucosa', etiqueta: 'Glucosa' },
  { id: 'sueno', etiqueta: 'Sueño' },
  { id: 'animo', etiqueta: 'Ánimo' },
  { id: 'ejercicio', etiqueta: 'Ejercicio' },
  { id: 'sintomas_inmunes', etiqueta: 'Síntomas inmunes' },
  { id: 'salud_mental', etiqueta: 'Salud mental (PHQ-9)' },
  { id: 'estado_conductual', etiqueta: 'Estado conductual' },
  { id: 'ambiente', etiqueta: 'Ambiente de cabina' },
  { id: 'diario', etiqueta: 'Diario' },
]

/** Preguntas del PHQ-9 (la 9 es de ideación). */
export const PREGUNTAS_PHQ9 = [
  'Poco interés o placer en hacer las cosas',
  'Sentirse desanimado, deprimido o sin esperanza',
  'Dificultad para conciliar o mantener el sueño, o dormir demasiado',
  'Sentirse cansado o con poca energía',
  'Poco apetito o comer en exceso',
  'Sentirse mal consigo mismo o que es un fracaso',
  'Dificultad para concentrarse en las cosas',
  'Moverse o hablar tan despacio que otros lo notan, o lo contrario',
  'Pensamientos de que estaría mejor muerto o de hacerse daño',
]

/** Formulario de registro: tipo + detalle según el tipo elegido. */
export const esquemaRegistroForm = z
  .object({
    tripulante_id: z.coerce.number().int().positive('Elige un tripulante'),
    tipo: z.enum(TIPOS_REGISTRO.map((t) => t.id)),
    // signos vitales
    frecuencia_cardiaca: numeroOpcional,
    spo2: numeroOpcional,
    temperatura_c: numeroOpcional,
    presion_sistolica: numeroOpcional,
    presion_diastolica: numeroOpcional,
    // sueño
    horas: numeroOpcional,
    calidad: numeroOpcional,
    despertares: numeroOpcional,
    // glucosa
    glucosa_mgdl: numeroOpcional,
    ayunas: z.boolean().optional(),
    // ánimo
    escala_animo: numeroOpcional,
    notas_animo: z.string().max(255).optional().default(''),
    // ejercicio
    ejercicio_tipo: z.enum(['resistencia', 'cardio']).optional(),
    minutos: numeroOpcional,
    cumplio_plan: z.boolean().optional(),
    // síntomas inmunes (0-3)
    fiebre: numeroOpcional,
    fatiga_inusual: numeroOpcional,
    infecciones: numeroOpcional,
    lesiones_cutaneas: numeroOpcional,
    cicatrizacion_lenta: numeroOpcional,
    // estado conductual
    gad7: numeroOpcional,
    estres: numeroOpcional,
    fatiga: numeroOpcional,
    // ambiente
    co2_ppm: numeroOpcional,
    humedad: numeroOpcional,
    ruido_db: numeroOpcional,
    // PHQ-9 (9 respuestas)
    phq9_0: numeroOpcional, phq9_1: numeroOpcional, phq9_2: numeroOpcional,
    phq9_3: numeroOpcional, phq9_4: numeroOpcional, phq9_5: numeroOpcional,
    phq9_6: numeroOpcional, phq9_7: numeroOpcional, phq9_8: numeroOpcional,
    // diario
    titulo: z.string().max(160).optional().default(''),
    contenido: z.string().optional().default(''),
  })
  .superRefine((datos, ctx) => {
    if (datos.tipo === 'diario' && !datos.titulo.trim()) ctx.addIssue({ code: 'custom', path: ['titulo'], message: 'El título es obligatorio' })
    if (datos.tipo === 'diario' && !datos.contenido.trim()) ctx.addIssue({ code: 'custom', path: ['contenido'], message: 'El contenido es obligatorio' })
    if (datos.tipo === 'sueno' && datos.horas === undefined) ctx.addIssue({ code: 'custom', path: ['horas'], message: 'Las horas son obligatorias' })
    if (datos.tipo === 'glucosa' && datos.glucosa_mgdl === undefined) ctx.addIssue({ code: 'custom', path: ['glucosa_mgdl'], message: 'La glucosa es obligatoria' })
    if (datos.tipo === 'animo' && datos.escala_animo === undefined) ctx.addIssue({ code: 'custom', path: ['escala_animo'], message: 'La escala de ánimo es obligatoria' })
    if (datos.tipo === 'ejercicio' && (datos.ejercicio_tipo === undefined || datos.minutos === undefined)) ctx.addIssue({ code: 'custom', path: ['minutos'], message: 'Tipo y minutos son obligatorios' })
  })

/**
 * Devuelve las respuestas del PHQ-9 desde el formulario.
 * @param {object} datos - Datos del formulario.
 * @returns {number[]} Respuestas (0-3).
 */
function respuestasPhq9(datos) {
  return Array.from({ length: 9 }, (_, i) => Number(datos[`phq9_${i}`]) || 0)
}

/**
 * Convierte el formulario en el detalle limpio que espera la API.
 * @param {object} datos - Datos del formulario.
 * @returns {object} Detalle por tipo.
 */
export function detalleDesdeFormulario(datos) {
  const numero = (v) => (v === undefined || v === null || v === '' ? undefined : Number(v))

  if (datos.tipo === 'signos_vitales') {
    const detalle = {}
    for (const clave of ['frecuencia_cardiaca', 'spo2', 'temperatura_c', 'presion_sistolica', 'presion_diastolica']) {
      const n = numero(datos[clave])
      if (n !== undefined) detalle[clave] = n
    }
    return detalle
  }
  if (datos.tipo === 'sueno') {
    return { horas: Number(datos.horas), ...(numero(datos.calidad) !== undefined ? { calidad: numero(datos.calidad) } : {}), ...(numero(datos.despertares) !== undefined ? { despertares: numero(datos.despertares) } : {}) }
  }
  if (datos.tipo === 'glucosa') {
    return { glucosa_mgdl: Number(datos.glucosa_mgdl), ...(datos.ayunas !== undefined ? { ayunas: datos.ayunas } : {}) }
  }
  if (datos.tipo === 'animo') {
    return { escala: Number(datos.escala_animo), ...(datos.notas_animo?.trim() ? { notas: datos.notas_animo.trim() } : {}) }
  }
  if (datos.tipo === 'ejercicio') {
    return { tipo: datos.ejercicio_tipo, minutos: Number(datos.minutos), cumplio_plan: Boolean(datos.cumplio_plan) }
  }
  if (datos.tipo === 'sintomas_inmunes') {
    const d = {}
    for (const clave of ['fiebre', 'fatiga_inusual', 'infecciones', 'lesiones_cutaneas', 'cicatrizacion_lenta']) {
      d[clave] = numero(datos[clave]) ?? 0
    }
    return d
  }
  if (datos.tipo === 'estado_conductual') {
    const d = {}
    for (const clave of ['gad7', 'estres', 'fatiga']) if (numero(datos[clave]) !== undefined) d[clave] = numero(datos[clave])
    return d
  }
  if (datos.tipo === 'ambiente') {
    const d = {}
    for (const clave of ['co2_ppm', 'temperatura_c', 'humedad', 'ruido_db']) if (numero(datos[clave]) !== undefined) d[clave] = numero(datos[clave])
    return d
  }
  if (datos.tipo === 'salud_mental') {
    const respuestas = respuestasPhq9(datos)
    const puntaje = sumarRespuestas(respuestas)
    return { respuestas, puntaje, nivel: interpretarPhq9(puntaje), item9_positivo: item9Phq9Positivo(respuestas) }
  }
  return { titulo: datos.titulo.trim(), contenido: datos.contenido.trim() }
}
