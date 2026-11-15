/**
 * @fileoverview Resumen de salud de un tripulante (/api/v1/resumen).
 * Agrega los últimos valores de cada tipo de registro, alertas y tendencias
 * para el dashboard y el monitor (datos reales de MySQL).
 * @module server/api/resumen
 */

import { Router } from 'express'
import { Op } from 'sequelize'
import { autenticacion } from '../middlewares/autenticacion.js'
import { modelos } from '../db/modelos.js'
import { esMedicoOAdmin, tripulanteDelUsuario } from './utilidades.js'

const {
  Tripulante, Registro, SignoVital, RegistroSueno, RegistroAnimo, RegistroGlucosa,
  RegistroEjercicio, RegistroEstadoConductual, Alerta, EntornoMision,
} = modelos
const rutas = Router()

/** Obtiene el último detalle de un tipo. */
async function ultimo(modelo, ids) {
  if (!ids.length) return null
  return modelo.findOne({ where: { registro_id: { [Op.in]: ids } }, order: [['id', 'DESC']] })
}

/** Obtiene todos los detalles de un tipo, mapeando fecha desde los registros. */
async function tendencia(modelo, registros, campoValor) {
  const ids = registros.map((r) => r.id)
  if (!ids.length) return []
  const filas = await modelo.findAll({ where: { registro_id: { [Op.in]: ids } } })
  const fechaPorRegistro = new Map(registros.map((r) => [r.id, r.fecha_registro]))
  return filas
    .map((f) => ({ fecha: fechaPorRegistro.get(f.registro_id), valor: f[campoValor] }))
    .filter((f) => f.valor !== null && f.valor !== undefined && f.fecha)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
}

// GET /api/v1/resumen?tripulante_id=X
rutas.get('/', autenticacion, async (req, res) => {
  const tripulanteId = req.query.tripulante_id ? Number(req.query.tripulante_id) : null
  let tripulante

  if (tripulanteId) {
    if (!esMedicoOAdmin(req)) {
      const propio = await tripulanteDelUsuario(req)
      if (!propio || propio.id !== tripulanteId) {
        return res.status(403).json({ codigo: 'PROHIBIDO', mensaje: 'Sin acceso a ese tripulante.' })
      }
    }
    tripulante = await Tripulante.findByPk(tripulanteId, { include: [{ model: EntornoMision, as: 'EntornoMision' }] })
  } else {
    tripulante = await tripulanteDelUsuario(req)
    if (tripulante) tripulante = await Tripulante.findByPk(tripulante.id, { include: [{ model: EntornoMision, as: 'EntornoMision' }] })
  }
  if (!tripulante) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Tripulante no encontrado.' })

  const desde = new Date(Date.now() - 14 * 86400000)
  const registros = await Registro.findAll({
    where: { tripulante_id: tripulante.id, eliminado_en: null, fecha_registro: { [Op.gte]: desde } },
    order: [['fecha_registro', 'DESC']],
  })
  const ids = registros.map((r) => r.id)

  const [signos, sueno, animo, glucosa, ejercicio, conductual] = await Promise.all([
    ultimo(SignoVital, ids),
    ultimo(RegistroSueno, ids),
    ultimo(RegistroAnimo, ids),
    ultimo(RegistroGlucosa, ids),
    ultimo(RegistroEjercicio, ids),
    ultimo(RegistroEstadoConductual, ids),
  ])

  const alertas = await Alerta.findAll({ where: { tripulante_id: tripulante.id }, order: [['id', 'DESC']] })

  const tendencias = {
    frecuenciaCardiaca: await tendencia(SignoVital, registros, 'frecuencia_cardiaca'),
    sueno: await tendencia(RegistroSueno, registros, 'horas'),
    animo: await tendencia(RegistroAnimo, registros, 'escala'),
  }

  const porTipo = {}
  for (const r of registros) porTipo[r.tipo] = (porTipo[r.tipo] ?? 0) + 1

  // Serializa explícitamente las instancias de Sequelize (evita referencias y `toJSON`).
  const plano = (x) => (x ? JSON.parse(JSON.stringify(x)) : null)

  res.json({
    tripulante: {
      id: tripulante.id,
      nombre: tripulante.nombre,
      cargo: tripulante.cargo,
      dia_mision: tripulante.dia_mision,
      origen: tripulante.origen ?? 'simulado',
      entorno: tripulante.EntornoMision?.nombre ?? null,
    },
    signos: plano(signos),
    sueno: plano(sueno),
    animo: plano(animo),
    glucosa: plano(glucosa),
    ejercicio: plano(ejercicio),
    conductual: plano(conductual),
    alertas: {
      total: alertas.length,
      nuevas: alertas.filter((a) => a.estado === 'nueva').length,
      criticas: alertas.filter((a) => a.severidad === 'critica' && a.estado !== 'resuelta').length,
      recientes: plano(alertas.slice(0, 5)),
    },
    tendencias,
    porTipo,
    totalRegistros: registros.length,
  })
})

export default rutas
