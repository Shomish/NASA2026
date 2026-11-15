/**
 * @fileoverview Clima espacial de NASA DONKI (FLR y SEP de los últimos 7 días).
 * Cachea la respuesta unas horas y degrada con un mensaje claro si NASA no responde.
 * @module server/api/donki
 */

import { Router } from 'express'
import { autenticacion } from '../middlewares/autenticacion.js'

const rutas = Router()
const TTL_MS = 3 * 60 * 60 * 1000
let cache = { datos: null, expira: 0 }

/** Formatea una fecha como YYYY-MM-DD. */
const formatear = (fecha) => fecha.toISOString().slice(0, 10)

/** Consulta un endpoint de NASA y devuelve JSON. */
async function consultar(url) {
  const respuesta = await fetch(url)
  if (!respuesta.ok) throw new Error(`NASA ${respuesta.status}`)
  return respuesta.json()
}

// GET /api/v1/donki
rutas.get('/', autenticacion, async (_req, res) => {
  if (cache.datos && Date.now() < cache.expira) return res.json(cache.datos)

  const clave = process.env.NASA_API_KEY || 'DEMO_KEY'
  const fin = new Date()
  const inicio = new Date(Date.now() - 7 * 86400000)
  const base = 'https://api.nasa.gov/DONKI'

  try {
    const [flr, sep] = await Promise.all([
      consultar(`${base}/FLR?startDate=${formatear(inicio)}&endDate=${formatear(fin)}&api_key=${clave}`),
      consultar(`${base}/SEP?startDate=${formatear(inicio)}&endDate=${formatear(fin)}&api_key=${clave}`),
    ])
    const datos = {
      disponible: true,
      flr: Array.isArray(flr) ? flr.length : 0,
      sep: Array.isArray(sep) ? sep.length : 0,
      eventos: [
        ...(Array.isArray(flr) ? flr.slice(-3).map((e) => ({ tipo: 'FLR', fecha: e.beginTime, clase: e.classType })) : []),
        ...(Array.isArray(sep) ? sep.slice(-3).map((e) => ({ tipo: 'SEP', fecha: e.eventTime })) : []),
      ],
      actualizado: new Date().toISOString(),
    }
    cache = { datos, expira: Date.now() + TTL_MS }
    return res.json(datos)
  } catch {
    return res.json({ disponible: false, mensaje: 'Sin datos de clima espacial' })
  }
})

export default rutas
