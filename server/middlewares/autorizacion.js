/**
 * @fileoverview Middleware de autorización por rol.
 * @module server/middlewares/autorizacion
 */

/**
 * Crea un middleware que exige un rol concreto.
 * @param {...string} roles - Roles permitidos.
 * @returns {import('express').RequestHandler} Middleware.
 */
export function autorizar(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ codigo: 'PROHIBIDO', mensaje: 'Sin permisos suficientes.' })
    }
    return next()
  }
}
