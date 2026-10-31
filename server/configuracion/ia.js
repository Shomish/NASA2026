/**
 * @fileoverview Configuración del proveedor de IA (Gemini) persistida en MySQL.
 * La clave de API se guarda en la tabla `configuracion_ia` (nunca viaja al
 * navegador). Si no hay clave en base, se usa la variable de entorno.
 * @module server/configuracion/ia
 */

import { modelos } from '../db/modelos.js'

const { ConfiguracionIA } = modelos

/**
 * Obtiene la configuración efectiva de IA.
 * Prioridad: BD (configuracion_ia) > variables de entorno IA_* / GEMINI_*.
 * @returns {Promise<{activo: boolean, proveedor: string, modelo: string, claveApi: string, claveConfigurada: boolean, urlBase: string, limiteDiario: number, limiteMensual: number}>} Configuración.
 */
export async function obtenerConfigIA() {
  const fila = await ConfiguracionIA.findOne({ where: { proveedor: 'gemini' } })
  // Proveedor activo: BD > env (IA_URL_BASE) > gemini por defecto.
  const proveedor = fila?.proveedor_activo || (process.env.IA_URL_BASE ? 'openai' : 'gemini')

  let claveApi
  let modelo
  let urlBase
  if (proveedor === 'openai') {
    claveApi = fila?.clave_api || process.env.IA_API_KEY || ''
    urlBase = fila?.url_base || process.env.IA_URL_BASE || ''
    modelo = fila?.modelo || process.env.IA_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'
  } else {
    claveApi = process.env.GEMINI_API_KEY || ''
    urlBase = ''
    modelo = fila?.modelo || process.env.GEMINI_MODEL || 'gemini-flash-latest'
  }

  const activo = Boolean(claveApi) && fila?.activo !== false
  return {
    activo,
    proveedor,
    modelo,
    claveApi,
    claveConfigurada: Boolean(claveApi),
    urlBase,
    limiteDiario: fila?.limite_diario_por_usuario ?? 50,
    limiteMensual: fila?.limite_mensual_global ?? 10000,
  }
}

/**
 * Actualiza la configuración de IA (solo administrador). Si `clave_api` llega
 * vacía, conserva la existente; si llega con valor, la reemplaza.
 * @param {{activo?: boolean, proveedor?: string, modelo?: string, clave_api?: string, url_base?: string}} datos - Campos.
 * @returns {Promise<object>} Configuración resultante.
 */
export async function actualizarConfigIA(datos) {
  const [fila] = await ConfiguracionIA.findOrCreate({
    where: { proveedor: 'gemini' },
    defaults: { proveedor: 'gemini', proveedor_activo: datos.proveedor === 'openai' ? 'openai' : 'gemini', activo: Boolean(datos.activo) },
  })
  const cambios = {}
  if (datos.activo !== undefined) cambios.activo = Boolean(datos.activo)
  if (datos.proveedor === 'openai' || datos.proveedor === 'gemini') cambios.proveedor_activo = datos.proveedor
  if (datos.modelo !== undefined && datos.modelo !== '') cambios.modelo = datos.modelo
  if (datos.clave_api !== undefined && datos.clave_api !== '') cambios.clave_api = datos.clave_api
  if (datos.url_base !== undefined && datos.url_base !== '') cambios.url_base = datos.url_base
  if (Object.keys(cambios).length > 0) await fila.update(cambios)
  return obtenerConfigIA()
}
