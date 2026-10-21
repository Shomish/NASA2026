/**
 * @fileoverview Rutas del chatbot (/api/v1/chat).
 * Protegidas, con rate limit por usuario y límite de tamaño de mensaje.
 * @module server/chat/rutas
 */

import { Router } from 'express'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { autenticacion } from '../middlewares/autenticacion.js'
import { generarRespuestaChat } from './servicio.js'

const rutas = Router()

/** Esquema del mensaje de chat (límite de tamaño). */
const esquemaMensaje = z.object({
  mensaje: z.string().min(1).max(1000),
  contexto: z.record(z.unknown()).optional().default({}),
})

// Rate limit por usuario (identificado por su id del JWT).
const limitadorChat = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.usuario?.id ?? req.ip,
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
  const resultado = await generarRespuestaChat({ mensaje, contexto })
  return res.json(resultado)
}

rutas.post('/', autenticacion, limitadorChat, chat)

export default rutas
