/**
 * @fileoverview Router de la aplicación (react-router-dom).
 * Code-splitting por ruta: /login no carga Recharts ni los módulos de salud.
 * @module app/router
 */

import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { VistaLogin, RutaProtegida } from '../features/auth/index.js'
import { RutaAdmin } from '../features/auth/RutaAdmin.jsx'
import SplashCarga from '../presentacion/componentes/SplashCarga.jsx'
import { ShellApp } from './shell/ShellApp.jsx'

// Carga diferida por módulo (no forman parte del bundle inicial de /login).
const cargarVista = (nombre) => lazy(() => import('../features/salud/vistas.jsx').then((m) => ({ default: m[nombre] })))
const VistaMonitorRuta = cargarVista('VistaMonitorRuta')
const VistaSignosRuta = cargarVista('VistaSignosRuta')
const VistaSaludIntegralRuta = cargarVista('VistaSaludIntegralRuta')
const VistaNutricionRuta = cargarVista('VistaNutricionRuta')
const VistaHistorialRuta = cargarVista('VistaHistorialRuta')
const VistaDiarioRuta = cargarVista('VistaDiarioRuta')
const VistaCalendarioRuta = cargarVista('VistaCalendarioRuta')
const VistaChatRuta = cargarVista('VistaChatRuta')

const VistaDashboard = lazy(() => import('../presentacion/componentes/VistaDashboard.jsx'))
const VistaConfiguracion = lazy(() => import('../presentacion/componentes/VistaConfiguracion.jsx'))
const VistaAyuda = lazy(() => import('../presentacion/componentes/VistaAyuda.jsx'))
const VistaDesignSystem = lazy(() => import('../presentacion/componentes/VistaDesignSystem.jsx'))
const VistaLanding = lazy(() => import('../presentacion/componentes/VistaLanding.jsx').then((m) => ({ default: m.VistaLanding })))

// Núcleo 2A (gestión): registro público y gestión de tripulantes/registros/usuarios.
const VistaRegistro = lazy(() => import('../features/auth/VistaRegistro.jsx').then((m) => ({ default: m.VistaRegistro })))
const VistaTripulantes = lazy(() => import('../features/gestion/indice.js').then((m) => ({ default: m.VistaTripulantes })))
const VistaRegistros = lazy(() => import('../features/gestion/indice.js').then((m) => ({ default: m.VistaRegistros })))
const VistaUsuarios = lazy(() => import('../features/gestion/indice.js').then((m) => ({ default: m.VistaUsuarios })))
const VistaAuditoria = lazy(() => import('../features/gestion/componentes/VistaAuditoria.jsx').then((m) => ({ default: m.VistaAuditoria })))
const VistaFundamento = lazy(() => import('../features/gestion/componentes/VistaFundamento.jsx').then((m) => ({ default: m.VistaFundamento })))
const VistaCuerpo = lazy(() => import('../features/gestion/componentes/VistaCuerpo.jsx').then((m) => ({ default: m.VistaCuerpo })))
const VistaAlertas = lazy(() => import('../features/gestion/componentes/VistaAlertas.jsx').then((m) => ({ default: m.VistaAlertas })))

/**
 * Enrutador principal.
 * @returns {import('react').JSX.Element} Rutas.
 */
export function Router() {
  return (
    <Routes>
      <Route path="/login" element={<VistaLogin />} />
      <Route path="/registro" element={<Suspense fallback={<SplashCarga />}><VistaRegistro /></Suspense>} />

      <Route path="/app" element={<RutaProtegida><ShellApp /></RutaProtegida>}>
        <Route index element={<Suspense fallback={<SplashCarga />}><VistaDashboard /></Suspense>} />
        <Route path="monitor" element={<Suspense fallback={<SplashCarga />}><VistaMonitorRuta /></Suspense>} />
        <Route path="tripulacion" element={<Suspense fallback={<SplashCarga />}><VistaTripulantes /></Suspense>} />
        <Route path="registros" element={<Suspense fallback={<SplashCarga />}><VistaRegistros /></Suspense>} />
        <Route path="usuarios" element={<Suspense fallback={<SplashCarga />}><RutaAdmin><VistaUsuarios /></RutaAdmin></Suspense>} />
        <Route path="auditoria" element={<Suspense fallback={<SplashCarga />}><RutaAdmin><VistaAuditoria /></RutaAdmin></Suspense>} />
        <Route path="fundamento" element={<Suspense fallback={<SplashCarga />}><VistaFundamento /></Suspense>} />
        <Route path="cuerpo" element={<Suspense fallback={<SplashCarga />}><VistaCuerpo /></Suspense>} />
        <Route path="signos" element={<Suspense fallback={<SplashCarga />}><VistaSignosRuta /></Suspense>} />
        <Route path="salud-integral" element={<Suspense fallback={<SplashCarga />}><VistaSaludIntegralRuta /></Suspense>} />
        <Route path="nutricion" element={<Suspense fallback={<SplashCarga />}><VistaNutricionRuta /></Suspense>} />
        <Route path="historial" element={<Suspense fallback={<SplashCarga />}><VistaHistorialRuta /></Suspense>} />
        <Route path="diario" element={<Suspense fallback={<SplashCarga />}><VistaDiarioRuta /></Suspense>} />
        <Route path="alertas" element={<Suspense fallback={<SplashCarga />}><VistaAlertas /></Suspense>} />
        <Route path="calendario" element={<Suspense fallback={<SplashCarga />}><VistaCalendarioRuta /></Suspense>} />
        <Route path="chat-ia" element={<Suspense fallback={<SplashCarga />}><VistaChatRuta /></Suspense>} />
        <Route path="configuracion" element={<Suspense fallback={<SplashCarga />}><VistaConfiguracion /></Suspense>} />
        <Route path="ayuda" element={<Suspense fallback={<SplashCarga />}><VistaAyuda /></Suspense>} />
      </Route>

      <Route path="/design-system" element={<Suspense fallback={<SplashCarga />}><VistaDesignSystem /></Suspense>} />
      <Route path="/" element={<Suspense fallback={<SplashCarga />}><VistaLanding /></Suspense>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
