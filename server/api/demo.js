/**
 * @fileoverview Acciones de demostración (solo DEMO_MODE).
 * "Avanzar día" adelanta la misión y genera nuevos datos de monitoreo para cada
 * tripulante activo, de modo que el dashboard y Mi cuerpo reflejen el avance.
 * @module server/api/demo
 */

import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { autenticacion } from '../middlewares/autenticacion.js'
import { config } from '../config.js'
import { modelos } from '../db/modelos.js'

const {
  Tripulante, Usuario, Registro, SignoVital, RegistroSueno, RegistroAnimo,
  RegistroEjercicio, RegistroGlucosa, RegistroEstadoConductual, Alerta,
} = modelos
const rutas = Router()

/** Crea una cabecera de registro + su detalle con código único y fecha actual. */
async function crear(tripulanteId, usuarioId, tipo, detalle, modeloDetalle) {
  const registro = await Registro.create({
    codigo: randomBytes(4).toString('hex').toUpperCase(),
    usuario_id: usuarioId,
    tripulante_id: tripulanteId,
    tipo,
    estado: 'validado',
    fecha_registro: new Date(),
  })
  await modeloDetalle.create({ registro_id: registro.id, ...detalle })
  return registro
}

/** Entero aleatorio entre min y max (inclusive). */
const aleatorio = (min, max) => Math.round(min + Math.random() * (max - min))

// POST /api/v1/demo/avanzar-dia (solo modo demo).
rutas.post('/avanzar-dia', autenticacion, async (_req, res) => {
  if (config.DEMO_MODE !== 'true') {
    return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Recurso no disponible.' })
  }

  await Tripulante.increment('dia_mision', { by: 1, where: { activo: true } })

  const admin = await Usuario.findOne({ where: { rol: 'administrador' } })
  const tripulantes = await Tripulante.findAll({ where: { activo: true } })

  for (const t of tripulantes) {
    const fc = aleatorio(66, 96)
    const spo2 = Number((93.4 + Math.random() * 5.6).toFixed(1))
    const sistolica = aleatorio(116, 130)
    const diastolica = aleatorio(76, 84)
    const temperatura = Number((36.4 + Math.random() * 0.6).toFixed(1))

    const registro = await crear(t.id, admin?.id ?? null, 'signos_vitales', {
      frecuencia_cardiaca: fc,
      spo2,
      presion_sistolica: sistolica,
      presion_diastolica: diastolica,
      temperatura_c: temperatura,
    }, SignoVital)

    await crear(t.id, admin?.id ?? null, 'sueno', {
      horas: Number((5.5 + Math.random() * 3).toFixed(1)),
      calidad: aleatorio(5, 9),
      despertares: aleatorio(1, 4),
    }, RegistroSueno)

    await crear(t.id, admin?.id ?? null, 'animo', { escala: aleatorio(4, 9) }, RegistroAnimo)

    await crear(t.id, admin?.id ?? null, 'ejercicio', {
      tipo: Math.random() > 0.5 ? 'resistencia' : 'cardio',
      minutos: aleatorio(15, 45),
      cumplio_plan: Math.random() > 0.4,
    }, RegistroEjercicio)

    await crear(t.id, admin?.id ?? null, 'glucosa', { glucosa_mgdl: aleatorio(88, 100), ayunas: true }, RegistroGlucosa)

    await crear(t.id, admin?.id ?? null, 'estado_conductual', {
      gad7: aleatorio(2, 9),
      estres: aleatorio(2, 7),
      fatiga: aleatorio(2, 7),
    }, RegistroEstadoConductual)

    // Genera una alerta si hay datos atípicos (SpO₂ baja o FC alta).
    if (spo2 < 95 || fc > 100) {
      await Alerta.create({
        tripulante_id: t.id,
        registro_origen_id: registro.id,
        severidad: 'critica',
        mensaje: `${t.nombre}: signos atípicos en el día ${t.dia_mision}.`,
        estado: 'nueva',
      })
    }
  }

  res.json({ ok: true, mensaje: 'Día de misión avanzado con nuevos datos de monitoreo.' })
})

export default rutas
