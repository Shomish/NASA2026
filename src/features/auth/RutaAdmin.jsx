/**
 * @fileoverview Guardia de ruta para administrador.
 * Redirige a /app si el usuario autenticado no es administrador (defensa en profundidad;
 * el servidor también devuelve 403 en los endpoints de administración).
 * @module features/auth/RutaAdmin
 */

import { Navigate } from 'react-router-dom'
import { useAlmacenSesion } from './almacenSesion.js'

/**
 * Ruta solo para administrador.
 * @param {object} props - Propiedades.
 * @param {import('react').ReactNode} props.children - Contenido protegido.
 * @returns {import('react').JSX.Element} Ruta o redirección.
 */
export function RutaAdmin({ children }) {
  const usuario = useAlmacenSesion((s) => s.usuario)
  if (usuario?.rol !== 'administrador') return <Navigate to="/app" replace />
  return children
}
