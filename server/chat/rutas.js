/**
 * @fileoverview Rutas del chatbot (/api/v1/chat).
 * Persistencia de conversaciones y mensajes por tripulante, con rate limit
 * persistente y límite de tamaño. La interfaz rediseñada llega en el 5D.
 * @module server/chat/rutas
 */

import { Router } from 'express'
import { z } from 'zod'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { autenticacion } from '../middlewares/autenticacion.js'
import { generarRespuestaChat } from './servicio.js'
import { modelos } from '../db/modelos.js'
import { tripulanteDelUsuario } from '../api/utilidades.js'
import { AlmacenRateLimitMySQL } from '../auth/almacenRateLimit.js'

const { ConversacionIA, MensajeIA } = modelos
const rutas = Router()

/** Estado del proveedor de IA (para que el front sepa si hay LLM en la nube). */
rutas.get('/estado', (_req, res) => {
  res.json({ disponible: Boolean(process.env.GEMINI_API_KEY) })
})

/** Esquema del mensaje de chat (límite de tamaño). */
const esquemaMensaje = z.object({
  mensaje: z.string().min(1).max(1000),
  contexto: z.record(z.unknown()).optional().default({}),
})

// Rate limit por usuario (identificado por su id del JWT), persistente en MySQL.
const limitadorChat = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: new AlmacenRateLimitMySQL(),
  keyGenerator: (req) => `chat:${req.usuario?.id ?? ipKeyGenerator(req.ip)}`,
  message: { codigo: 'DEMASIADAS_SOLICITUDES', mensaje: 'Demasiadas consultas. Inténtalo más tarde.' },
})

/**
 * POST /api/v1/chat
 * @param {import('express').Request} req - Petición.
 * @param {import('express').Response} res - Respuesta.
 */
async function chat(req, res) {
  const validacion = esquemaMensaje.safeParse(req.body ?? {})
  if (!validacion.success) {
    return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Mensaje inválido.' })
  }
  const { mensaje, contexto } = validacion.data

  // Persistencia: conversación por usuario + tripulante y mensajes.
  const tripulante = await tripulanteDelUsuario(req)
  const [conversacion] = await ConversacionIA.findOrCreate({
    where: { usuario_id: req.usuario.id, tripulante_id: tripulante?.id ?? 0, estado: 'activa' },
    defaults: { titulo: mensaje.slice(0, 80), proveedor: 'gemini', modo: 'local' },
  })
  await MensajeIA.create({ conversacion_id: conversacion.id, rol: 'usuario', contenido: mensaje })

  const resultado = await generarRespuestaChat({ mensaje, contexto })

  await MensajeIA.create({ conversacion_id: conversacion.id, rol: 'asistente', contenido: resultado.respuesta, escalamiento: Boolean(resultado.escalamiento) })

  return res.json({ ...resultado, conversacion_id: conversacion.id })
}

// Lista las conversaciones del usuario (historial por tripulante).
rutas.get('/conversaciones', autenticacion, async (req, res) => {
  const conversaciones = await ConversacionIA.findAll({ where: { usuario_id: req.usuario.id }, order: [['id', 'DESC']] })
  res.json(conversaciones)
})

// Mensajes de una conversación (solo del propio usuario).
rutas.get('/conversaciones/:id/mensajes', autenticacion, async (req, res) => {
  const conversacion = await ConversacionIA.findByPk(req.params.id)
  if (!conversacion || conversacion.usuario_id !== Number(req.usuario.id)) {
    return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Conversación no encontrada.' })
  }
  const mensajes = await MensajeIA.findAll({ where: { conversacion_id: conversacion.id }, order: [['id', 'ASC']] })
  res.json(mensajes)
})

rutas.post('/', autenticacion, limitadorChat, chat)

export default rutas
