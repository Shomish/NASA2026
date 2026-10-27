/**
 * @fileoverview Ruta protegida (guardia de rutas).
 * Redirige a /login si no hay sesión; recupera la sesión vía refresh al recargar (F5).
 * @module features/auth/RutaProtegida
 */

import { useEffect, useRef, useState } from 'react'
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
  // Evita el doble refresh de React.StrictMode (que rotaría dos veces el token).
  const refrescando = useRef(false)

  // Recupera la sesión vía refresh al recargar (F5) si no hay token en memoria.
  useEffect(() => {
    if (accessToken || refrescando.current) return undefined
    refrescando.current = true
    apiRefresh()
      .then((sesion) => iniciar(sesion.accessToken, sesion.usuario))
      .catch(() => {
        /* Sin cookie válida: se redirigirá a /login. */
      })
      .finally(() => setVerificando(false))
    return undefined
  }, [accessToken, iniciar])

  if (verificando) return <SplashCarga />

  if (!accessToken) {
    return <Navigate to="/login" state={{ desde: ubicacion }} replace />
  }
  return children
}
