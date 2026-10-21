/**
 * @fileoverview Esquema Zod compartido entre frontend y backend (login).
 * @module shared/esquemaLogin
 */

import { z } from 'zod'

/**
 * Esquema de credenciales de inicio de sesión.
 */
export const esquemaLogin = z.object({
  username: z.string().min(1, 'El usuario es obligatorio').max(100),
  contrasena: z.string().min(1, 'La contraseña es obligatoria').max(200),
})

/**
 * Tipo inferido de las credenciales de login.
 * @typedef {import('zod').infer<typeof esquemaLogin>} CredencialesLogin
 */
