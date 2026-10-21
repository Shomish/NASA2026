/**
 * @fileoverview Router de la aplicación (react-router-dom).
 * Code-splitting: /login no carga App (Recharts) ni el sistema de diseño.
 * @module app/router
 */

import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { VistaLogin, RutaProtegida } from '../features/auth/index.js'
import SplashCarga from '../presentacion/componentes/SplashCarga.jsx'

// Carga diferida de las vistas pesadas (no forman parte del bundle inicial de /login).
const App = lazy(() => import('../App.jsx'))
const VistaDesignSystem = lazy(() => import('../presentacion/componentes/VistaDesignSystem.jsx'))

/**
 * Enrutador principal.
 * @returns {import('react').JSX.Element} Rutas.
 */
export function Router() {
  return (
    <Routes>
      <Route path="/login" element={<VistaLogin />} />
      <Route
        path="/app"
        element={
          <RutaProtegida>
            <Suspense fallback={<SplashCarga />}>
              <App />
            </Suspense>
          </RutaProtegida>
        }
      />
      <Route
        path="/design-system"
        element={
          <Suspense fallback={<SplashCarga />}>
            <VistaDesignSystem />
          </Suspense>
        }
      />
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
