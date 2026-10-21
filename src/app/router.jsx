/**
 * @fileoverview Router de la aplicación (react-router-dom).
 * Code-splitting por ruta: /login no carga Recharts ni los módulos de salud.
 * @module app/router
 */

import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { VistaLogin, RutaProtegida } from '../features/auth/index.js'
import SplashCarga from '../presentacion/componentes/SplashCarga.jsx'
import { ShellApp } from './shell/ShellApp.jsx'

// Carga diferida por módulo (no forman parte del bundle inicial de /login).
const cargarVista = (nombre) => lazy(() => import('../features/salud/vistas.jsx').then((m) => ({ default: m[nombre] })))
const VistaMonitorRuta = cargarVista('VistaMonitorRuta')
const VistaTripulacionRuta = cargarVista('VistaTripulacionRuta')
const VistaSignosRuta = cargarVista('VistaSignosRuta')
const VistaSaludIntegralRuta = cargarVista('VistaSaludIntegralRuta')
const VistaNutricionRuta = cargarVista('VistaNutricionRuta')
const VistaHistorialRuta = cargarVista('VistaHistorialRuta')
const VistaDiarioRuta = cargarVista('VistaDiarioRuta')
const VistaAlertasRuta = cargarVista('VistaAlertasRuta')
const VistaCalendarioRuta = cargarVista('VistaCalendarioRuta')
const VistaChatRuta = cargarVista('VistaChatRuta')

const VistaDashboard = lazy(() => import('../presentacion/componentes/VistaDashboard.jsx'))
const VistaConfiguracion = lazy(() => import('../presentacion/componentes/VistaConfiguracion.jsx'))
const VistaAyuda = lazy(() => import('../presentacion/componentes/VistaAyuda.jsx'))
const VistaPresentacion = lazy(() => import('../presentacion/componentes/VistaPresentacion.jsx'))
const VistaDesignSystem = lazy(() => import('../presentacion/componentes/VistaDesignSystem.jsx'))

/**
 * Enrutador principal.
 * @returns {import('react').JSX.Element} Rutas.
 */
export function Router() {
  return (
    <Routes>
      <Route path="/login" element={<VistaLogin />} />

      <Route path="/app" element={<RutaProtegida><ShellApp /></RutaProtegida>}>
        <Route index element={<Suspense fallback={<SplashCarga />}><VistaDashboard /></Suspense>} />
        <Route path="monitor" element={<Suspense fallback={<SplashCarga />}><VistaMonitorRuta /></Suspense>} />
        <Route path="tripulacion" element={<Suspense fallback={<SplashCarga />}><VistaTripulacionRuta /></Suspense>} />
        <Route path="signos" element={<Suspense fallback={<SplashCarga />}><VistaSignosRuta /></Suspense>} />
        <Route path="salud-integral" element={<Suspense fallback={<SplashCarga />}><VistaSaludIntegralRuta /></Suspense>} />
        <Route path="nutricion" element={<Suspense fallback={<SplashCarga />}><VistaNutricionRuta /></Suspense>} />
        <Route path="historial" element={<Suspense fallback={<SplashCarga />}><VistaHistorialRuta /></Suspense>} />
        <Route path="diario" element={<Suspense fallback={<SplashCarga />}><VistaDiarioRuta /></Suspense>} />
        <Route path="alertas" element={<Suspense fallback={<SplashCarga />}><VistaAlertasRuta /></Suspense>} />
        <Route path="calendario" element={<Suspense fallback={<SplashCarga />}><VistaCalendarioRuta /></Suspense>} />
        <Route path="chat-ia" element={<Suspense fallback={<SplashCarga />}><VistaChatRuta /></Suspense>} />
        <Route path="presentacion" element={<Suspense fallback={<SplashCarga />}><VistaPresentacion /></Suspense>} />
        <Route path="configuracion" element={<Suspense fallback={<SplashCarga />}><VistaConfiguracion /></Suspense>} />
        <Route path="ayuda" element={<Suspense fallback={<SplashCarga />}><VistaAyuda /></Suspense>} />
      </Route>

      <Route path="/design-system" element={<Suspense fallback={<SplashCarga />}><VistaDesignSystem /></Suspense>} />
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
