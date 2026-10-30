/**
 * @fileoverview Rutas del chatbot (/api/v1/chat).
 * Consentimiento revocable (sin consentimiento vigente no se llama a la nube),
 * límites de uso persistentes, sanitización y persistencia de conversaciones.
 * @module server/chat/rutas
 */

import { Router } from 'express'
import { z } from 'zod'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { autenticacion } from '../middlewares/autenticacion.js'
import { generarRespuestaChat } from './servicio.js'
import { GeminiChatProvider, ProveedorLocal } from './proveedores.js'
import { consentimientoVigente, fijarConsentimiento, dentroDeLimites, registrarUso, sanitizarEntrada } from './privacidad.js'
import { modelos } from '../db/modelos.js'
import { tripulanteDelUsuario, auditar } from '../api/utilidades.js'
import { AlmacenRateLimitMySQL } from '../auth/almacenRateLimit.js'

const { ConversacionIA, MensajeIA, Alerta, ConsentimientoIA } = modelos
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
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Mensaje inválido.' })
  const mensaje = sanitizarEntrada(validacion.data.mensaje)
  const contexto = validacion.data.contexto

  const tripulante = await tripulanteDelUsuario(req)

  // Sin consentimiento vigente o fuera de límites, no se llama a la nube.
  const consentimiento = tripulante ? await consentimientoVigente(req.usuario.id, tripulante.id) : false
  const dentroLimite = await dentroDeLimites(req.usuario.id)
  const usarNube = consentimiento && dentroLimite
  const proveedor = usarNube ? new GeminiChatProvider(process.env.GEMINI_API_KEY ?? '') : new ProveedorLocal()

  const [conversacion] = await ConversacionIA.findOrCreate({
    where: { usuario_id: req.usuario.id, tripulante_id: tripulante?.id ?? null, estado: 'activa' },
    defaults: { titulo: mensaje.slice(0, 80), proveedor: 'gemini', modo: usarNube ? 'nube' : 'local' },
  })
  await MensajeIA.create({ conversacion_id: conversacion.id, rol: 'usuario', contenido: mensaje })

  const resultado = await generarRespuestaChat({ mensaje, contexto, proveedor })

  // Escalamiento en código: crea una alerta enlazada al mensaje.
  let alertaId = null
  if (resultado.escalamiento) {
    const alerta = await Alerta.create({
      tripulante_id: tripulante?.id ?? null,
      registro_origen_id: null,
      severidad: 'critica',
      mensaje: resultado.escalamiento,
      estado: 'nueva',
    })
    alertaId = alerta.id
  }

  await MensajeIA.create({
    conversacion_id: conversacion.id,
    rol: 'asistente',
    contenido: resultado.respuesta,
    escalamiento: Boolean(resultado.escalamiento),
    alerta_id: alertaId,
  })

  if (resultado.usoNube) await registrarUso(req.usuario.id)

  return res.json({ respuesta: resultado.respuesta, escalamiento: resultado.escalamiento, modo: resultado.usoNube ? 'nube' : 'local', conversacion_id: conversacion.id })
}

// Consentimiento del usuario para enviar datos a la nube.
rutas.get('/consentimiento', autenticacion, async (req, res) => {
  const tripulante = await tripulanteDelUsuario(req)
  const consentimiento = tripulante
    ? await ConsentimientoIA.findOne({ where: { usuario_id: req.usuario.id, tripulante_id: tripulante.id } })
    : null
  res.json({ acepta_nube: Boolean(consentimiento?.acepta_nube && !consentimiento?.revocado_en) })
})

// Establece o revoca el consentimiento (auditado, sin guardar contenido de mensajes).
rutas.put('/consentimiento', autenticacion, async (req, res) => {
  const validacion = z.object({ acepta_nube: z.boolean() }).safeParse(req.body ?? {})
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Datos inválidos.' })
  const tripulante = await tripulanteDelUsuario(req)
  const consentimiento = await fijarConsentimiento(req.usuario.id, tripulante?.id ?? null, validacion.data.acepta_nube)
  await auditar({ usuarioId: req.usuario.id, accion: validacion.data.acepta_nube ? 'consentir_nube' : 'revocar_nube', entidad: 'consentimiento_ia', entidadId: consentimiento.id, req })
  res.json({ acepta_nube: Boolean(consentimiento.acepta_nube && !consentimiento.revocado_en) })
})

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
