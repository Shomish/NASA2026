/**
 * @fileoverview Esquemas Zod de los formularios del núcleo (compartidos con el servidor en estructura).
 * @module features/gestion/esquemas
 */

import { z } from 'zod'

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
  alergias: z
    .string()
    .optional()
    .default('')
    .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [])),
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
  { id: 'sueno', etiqueta: 'Sueño' },
  { id: 'diario', etiqueta: 'Diario' },
]

/** Formulario de registro: tipo + detalle según el tipo elegido. */
export const esquemaRegistroForm = z
  .object({
    tripulante_id: z.coerce.number().int().positive('Elige un tripulante'),
    tipo: z.enum(['signos_vitales', 'sueno', 'diario']),
    frecuencia_cardiaca: numeroOpcional,
    spo2: numeroOpcional,
    temperatura_c: numeroOpcional,
    presion_sistolica: numeroOpcional,
    presion_diastolica: numeroOpcional,
    horas: numeroOpcional,
    calidad: numeroOpcional,
    despertares: numeroOpcional,
    titulo: z.string().max(160).optional().default(''),
    contenido: z.string().optional().default(''),
  })
  .superRefine((datos, ctx) => {
    if (datos.tipo === 'diario' && !datos.titulo.trim()) {
      ctx.addIssue({ code: 'custom', path: ['titulo'], message: 'El título es obligatorio' })
    }
    if (datos.tipo === 'diario' && !datos.contenido.trim()) {
      ctx.addIssue({ code: 'custom', path: ['contenido'], message: 'El contenido es obligatorio' })
    }
    if (datos.tipo === 'sueno' && datos.horas === undefined) {
      ctx.addIssue({ code: 'custom', path: ['horas'], message: 'Las horas son obligatorias' })
    }
  })

/**
 * Convierte el formulario en el detalle limpio que espera la API.
 * @param {object} datos - Datos del formulario.
 * @returns {object} Detalle por tipo.
 */
export function detalleDesdeFormulario(datos) {
  if (datos.tipo === 'signos_vitales') {
    const detalle = {}
    for (const clave of ['frecuencia_cardiaca', 'spo2', 'temperatura_c', 'presion_sistolica', 'presion_diastolica']) {
      if (datos[clave] !== undefined && datos[clave] !== null && datos[clave] !== '') detalle[clave] = Number(datos[clave])
    }
    return detalle
  }
  if (datos.tipo === 'sueno') {
    return {
      horas: Number(datos.horas),
      ...(datos.calidad !== undefined && datos.calidad !== '' ? { calidad: Number(datos.calidad) } : {}),
      ...(datos.despertares !== undefined && datos.despertares !== '' ? { despertares: Number(datos.despertares) } : {}),
    }
  }
  return { titulo: datos.titulo.trim(), contenido: datos.contenido.trim() }
}
