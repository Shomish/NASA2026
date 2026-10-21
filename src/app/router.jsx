/**
 * @fileoverview Router de la aplicación (react-router-dom).
 * Code-splitting por ruta: /login no carga Recharts ni el dashboard.
 * @module app/router
 */

import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { VistaLogin, RutaProtegida } from '../features/auth/index.js'
import SplashCarga from '../presentacion/componentes/SplashCarga.jsx'
import { ShellApp } from './shell/ShellApp.jsx'

// Carga diferida de las vistas pesadas (no forman parte del bundle inicial de /login).
const App = lazy(() => import('../App.jsx'))
const VistaDashboard = lazy(() => import('../presentacion/componentes/VistaDashboard.jsx'))
const VistaConfiguracion = lazy(() => import('../presentacion/componentes/VistaConfiguracion.jsx'))
const VistaAyuda = lazy(() => import('../presentacion/componentes/VistaAyuda.jsx'))
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
            <ShellApp />
          </RutaProtegida>
        }
      >
        <Route index element={<Suspense fallback={<SplashCarga />}><VistaDashboard /></Suspense>} />
        <Route path="monitor" element={<Suspense fallback={<SplashCarga />}><App /></Suspense>} />
        <Route path="configuracion" element={<Suspense fallback={<SplashCarga />}><VistaConfiguracion /></Suspense>} />
        <Route path="ayuda" element={<Suspense fallback={<SplashCarga />}><VistaAyuda /></Suspense>} />
      </Route>

      <Route path="/design-system" element={<Suspense fallback={<SplashCarga />}><VistaDesignSystem /></Suspense>} />
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
