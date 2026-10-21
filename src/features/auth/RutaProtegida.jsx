/**
 * @fileoverview Ruta protegida (guardia de rutas).
 * Redirige a /login si no hay access token en memoria.
 * @module features/auth/RutaProtegida
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAlmacenSesion } from './almacenSesion.js'

/**
 * Ruta protegida: solo renderiza los hijos si hay sesión.
 * @param {object} props - Propiedades.
 * @param {import('react').ReactNode} props.children - Contenido protegido.
 * @returns {import('react').JSX.Element} Ruta o redirección.
 */
export function RutaProtegida({ children }) {
  const accessToken = useAlmacenSesion((s) => s.accessToken)
  const ubicacion = useLocation()

  if (!accessToken) {
    return <Navigate to="/login" state={{ desde: ubicacion }} replace />
  }
  return children
}
