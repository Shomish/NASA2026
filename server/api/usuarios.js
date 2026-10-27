/**
 * @fileoverview Rutas de usuarios (/api/v1/usuarios).
 * Solo administrador. Protege al último administrador activo.
 * @module server/api/usuarios
 */

import { Router } from 'express'
import { z } from 'zod'
import { hash } from 'bcrypt'
import { autenticacion } from '../middlewares/autenticacion.js'
import { autorizar } from '../middlewares/autorizacion.js'
import { modelos } from '../db/modelos.js'
import { auditar } from './utilidades.js'

const { Usuario } = modelos
const rutas = Router()
const COSTE = 12

/** Esquema de creación de usuario (rol permitido por administrador). */
const esquemaUsuario = z.object({
  nombre: z.string().min(2).max(120),
  email: z.string().email().max(190),
  contrasena: z.string().min(8).max(200),
  rol: z.enum(['administrador', 'medico', 'tripulante']),
})

/**
 * Cuenta los administradores activos.
 * @returns {Promise<number>} Cantidad.
 */
async function contarAdministradoresActivos() {
  return Usuario.count({ where: { rol: 'administrador', activo: true } })
}

// GET /api/v1/usuarios
rutas.get('/', autenticacion, autorizar('administrador'), async (_req, res) => {
  const usuarios = await Usuario.findAll({ attributes: ['id', 'nombre', 'email', 'rol', 'activo'] })
  res.json(usuarios)
})

// POST /api/v1/usuarios
rutas.post('/', autenticacion, autorizar('administrador'), async (req, res) => {
  const validacion = esquemaUsuario.safeParse(req.body ?? {})
  if (!validacion.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Datos inválidos.' })
  try {
    const passwordHash = await hash(validacion.data.contrasena, COSTE)
    const usuario = await Usuario.create({
      nombre: validacion.data.nombre,
      email: validacion.data.email,
      password: passwordHash,
      rol: validacion.data.rol,
    })
    await auditar({ usuarioId: req.usuario.id, accion: 'crear', entidad: 'usuario', entidadId: usuario.id, req })
    res.status(201).json({ id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol })
  } catch {
    res.status(409).json({ codigo: 'CONFLICTO', mensaje: 'No se pudo crear el usuario.' })
  }
})

// PUT /api/v1/usuarios/:id/rol
rutas.put('/:id/rol', autenticacion, autorizar('administrador'), async (req, res) => {
  const rol = z.enum(['administrador', 'medico', 'tripulante']).safeParse(req.body?.rol)
  if (!rol.success) return res.status(400).json({ codigo: 'DATOS_INVALIDOS', mensaje: 'Rol inválido.' })
  const usuario = await Usuario.findByPk(req.params.id)
  if (!usuario) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Usuario no encontrado.' })

  // No se puede degradar al último administrador.
  if (usuario.rol === 'administrador' && rol.data !== 'administrador') {
    const adminActivos = await contarAdministradoresActivos()
    if (adminActivos <= 1) return res.status(409).json({ codigo: 'ULTIMO_ADMIN', mensaje: 'No se puede degradar al último administrador.' })
  }
  await usuario.update({ rol: rol.data })
  await auditar({ usuarioId: req.usuario.id, accion: 'cambiar_rol', entidad: 'usuario', entidadId: usuario.id, req })
  res.json({ id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol })
})

// PUT /api/v1/usuarios/:id/desactivar
rutas.put('/:id/desactivar', autenticacion, autorizar('administrador'), async (req, res) => {
  const usuario = await Usuario.findByPk(req.params.id)
  if (!usuario) return res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'Usuario no encontrado.' })

  if (usuario.rol === 'administrador') {
    const adminActivos = await contarAdministradoresActivos()
    if (adminActivos <= 1) return res.status(409).json({ codigo: 'ULTIMO_ADMIN', mensaje: 'No se puede desactivar al último administrador.' })
  }
  await usuario.update({ activo: false })
  await auditar({ usuarioId: req.usuario.id, accion: 'desactivar', entidad: 'usuario', entidadId: usuario.id, req })
  res.status(204).end()
})

export default rutas
