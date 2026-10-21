/**
 * @fileoverview Ruta protegida (guardia de rutas).
 * Redirige a /login si no hay sesión; recupera la sesión vía refresh al recargar (F5).
 * @module features/auth/RutaProtegida
 */

import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAlmacenSesion } from './almacenSesion.js'
import { apiRefresh } from './api.js'
import SplashCarga from '../../presentacion/componentes/SplashCarga.jsx'

/**
 * Ruta protegida: solo renderiza los hijos si hay sesión.
 * @param {object} props - Propiedades.
 * @param {import('react').ReactNode} props.children - Contenido protegido.
 * @returns {import('react').JSX.Element} Ruta o redirección.
 */
export function RutaProtegida({ children }) {
  const accessToken = useAlmacenSesion((s) => s.accessToken)
  const iniciar = useAlmacenSesion((s) => s.iniciar)
  const ubicacion = useLocation()
  const [verificando, setVerificando] = useState(!accessToken)

  // Recupera la sesión vía refresh al recargar (F5) si no hay token en memoria.
  useEffect(() => {
    if (accessToken) return undefined
    let activo = true
    apiRefresh()
      .then((sesion) => {
        if (activo) iniciar(sesion.accessToken, sesion.usuario)
      })
      .catch(() => {
        /* Sin cookie válida: se redirigirá a /login. */
      })
      .finally(() => {
        if (activo) setVerificando(false)
      })
    return () => {
      activo = false
    }
  }, [accessToken, iniciar])

  if (verificando) return <SplashCarga />

  if (!accessToken) {
    return <Navigate to="/login" state={{ desde: ubicacion }} replace />
  }
  return children
}
