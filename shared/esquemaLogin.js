/**
 * @fileoverview Esquemas Zod compartidos (login y registro).
 * @module shared/esquemaLogin
 */

import { z } from 'zod'

/**
 * Esquema de credenciales de inicio de sesión (por email).
 */
export const esquemaLogin = z.object({
  email: z.string().email('Email inválido').max(190),
  contrasena: z.string().min(1, 'La contraseña es obligatoria').max(200),
})

/**
 * Esquema de registro de usuario (rol tripulante por defecto, impuesto en el servidor).
 */
export const esquemaRegistro = z.object({
  nombre: z.string().min(2, 'El nombre es obligatorio').max(120),
  email: z.string().email('Email inválido').max(190),
  contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(200),
})
