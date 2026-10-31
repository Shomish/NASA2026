/**
 * @fileoverview Shell de la aplicación autenticada (sidebar + topbar + contenido).
 * Desktop: sidebar colapsable. Móvil: drawer + barra inferior de 5 destinos.
 * @module app/shell/ShellApp
 */

import { useEffect, useState, lazy, Suspense } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  Bell,
  BookOpen,
  Bot,
  Brain,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  HeartPulse,
  HelpCircle,
  History,
  LayoutDashboard,
  Leaf,
  Menu,
  Moon,
  NotebookPen,
  PersonStanding,
  Plus,
  Search,
  ScrollText,
  Settings,
  Sun,
  User,
  UserCog,
  Users,
} from 'lucide-react'
import { cn } from '../../presentacion/sistema/cn.js'
import { useTema } from '../../presentacion/sistema/tema.jsx'
import { useAlmacenSesion } from '../../features/auth/almacenSesion.js'
import { apiLogout } from '../../features/auth/api.js'
import { useContextoTripulante } from '../../features/gestion/almacenContexto.js'
import { useIdioma, IDIOMAS, useTraduccion } from '../../shared/idioma.js'
import { Drawer } from '../../presentacion/sistema/movil/Drawer.jsx'
import { BarraInferior } from '../../presentacion/sistema/movil/BarraInferior.jsx'
import { CommandPalette } from './CommandPalette.jsx'

// Carga diferida: la barra de contexto (y su feature de gestión) no forma parte
// del bundle inicial de /login ni del shell en rutas no de datos.
const BarraContextoTripulante = lazy(() =>
  import('../../features/gestion/componentes/BarraContextoTripulante.jsx').then((m) => ({ default: m.BarraContextoTripulante })),
)
const BadgeAlertas = lazy(() =>
  import('../../features/gestion/componentes/BadgeAlertas.jsx').then((m) => ({ default: m.BadgeAlertas })),
)
const IndicadorSincronizacion = lazy(() =>
  import('../../features/gestion/componentes/IndicadorSincronizacion.jsx').then((m) => ({ default: m.IndicadorSincronizacion })),
)
const PanelNotificaciones = lazy(() =>
  import('../../features/gestion/componentes/PanelNotificaciones.jsx').then((m) => ({ default: m.PanelNotificaciones })),
)
const Tour = lazy(() =>
  import('../../features/gestion/componentes/Tour.jsx').then((m) => ({ default: m.Tour })),
)

/** Rutas de módulos de datos (muestran la barra de contexto de tripulante). */
const RUTAS_DE_DATOS = [
  '/app/monitor', '/app/signos', '/app/salud-integral', '/app/calendario',
  '/app/nutricion', '/app/registros', '/app/historial', '/app/diario',
  '/app/alertas', '/app/chat-ia',
]

/** Elementos de navegación del sidebar (secciones). */
const NAVEGACION = [
  { seccion: 'nav.principal', items: [{ id: 'dashboard', etiqueta: 'nav.dashboard', icono: LayoutDashboard, ruta: '/app' }] },
  {
    seccion: 'nav.monitoreo',
    items: [
      { id: 'monitor', etiqueta: 'nav.monitor', icono: HeartPulse, ruta: '/app/monitor' },
      { id: 'cuerpo', etiqueta: 'nav.cuerpo', icono: PersonStanding, ruta: '/app/cuerpo' },
      { id: 'signos', etiqueta: 'nav.signos', icono: Activity, ruta: '/app/signos' },
      { id: 'salud-integral', etiqueta: 'nav.saludIntegral', icono: Brain, ruta: '/app/salud-integral' },
      { id: 'calendario', etiqueta: 'nav.calendario', icono: Calendar, ruta: '/app/calendario' },
    ],
  },
  { seccion: 'nav.nutricion', items: [{ id: 'nutricion', etiqueta: 'nav.nutricionItem', icono: Leaf, ruta: '/app/nutricion' }] },
  {
    seccion: 'nav.tripulacion',
    items: [
      { id: 'registros', etiqueta: 'nav.registros', icono: ClipboardList, ruta: '/app/registros' },
      { id: 'tripulacion', etiqueta: 'nav.tripulantes', icono: Users, ruta: '/app/tripulacion' },
      { id: 'historial', etiqueta: 'nav.historial', icono: History, ruta: '/app/historial' },
      { id: 'diario', etiqueta: 'nav.diario', icono: NotebookPen, ruta: '/app/diario' },
    ],
  },
  {
    seccion: 'nav.sistema',
    items: [
      { id: 'alertas', etiqueta: 'nav.alertas', icono: Bell, ruta: '/app/alertas', badge: 'alertas' },
      { id: 'chat-ia', etiqueta: 'nav.chatIa', icono: Bot, ruta: '/app/chat-ia' },
      { id: 'usuarios', etiqueta: 'nav.usuarios', icono: UserCog, ruta: '/app/usuarios', soloAdmin: true },
      { id: 'auditoria', etiqueta: 'nav.auditoria', icono: ScrollText, ruta: '/app/auditoria', soloAdmin: true },
      { id: 'fundamento', etiqueta: 'nav.fundamento', icono: BookOpen, ruta: '/app/fundamento' },
      { id: 'configuracion', etiqueta: 'nav.configuracion', icono: Settings, ruta: '/app/configuracion' },
      { id: 'ayuda', etiqueta: 'nav.ayuda', icono: HelpCircle, ruta: '/app/ayuda' },
    ],
  },
]

/**
 * Hook de reloj en tiempo real.
 * @returns {{hora: string, fecha: string}} Reloj.
 */
function usarReloj() {
  const [ahora, setAhora] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return {
    hora: ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    fecha: ahora.toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
  }
}

/**
 * Shell de la aplicación autenticada.
 * @returns {import('react').JSX.Element} Shell.
 */
export function ShellApp() {
  const navigate = useNavigate()
  const ubicacion = useLocation()
  const { modoEfectivo, alternarModo } = useTema()
  const usuario = useAlmacenSesion((s) => s.usuario)
  const cerrar = useAlmacenSesion((s) => s.cerrar)
  const idioma = useIdioma((s) => s.idioma)
  const fijarIdioma = useIdioma((s) => s.fijarIdioma)
  const t = useTraduccion()
  const [colapsado, setColapsado] = useState(false)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [paletteAbierto, setPaletteAbierto] = useState(false)
  const reloj = usarReloj()

  // Cierra el drawer al navegar (asegura que no quede abierto tras tocar un ítem).
  useEffect(() => {
    setDrawerAbierto(false)
  }, [ubicacion.pathname])

  // Atajo Ctrl/Cmd + K para abrir el buscador global.
  useEffect(() => {
    const manejarTecla = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteAbierto(true)
      }
    }
    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [])

  const cerrarSesion = async () => {
    const usuarioId = usuario?.id
    await apiLogout()
    if (usuarioId) useContextoTripulante.getState().limpiar(usuarioId)
    cerrar()
    navigate('/login', { replace: true })
  }

  const contenidoSidebar = (
    <nav className="flex-1 space-y-5 overflow-y-auto">
      {NAVEGACION.map((grupo) => {
        const items = grupo.items.filter((item) => !item.soloAdmin || usuario?.rol === 'administrador')
        if (items.length === 0) return null
        return (
          <div key={grupo.seccion}>
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-tinta-suave">{t(grupo.seccion)}</div>
            <div className="space-y-1">
              {items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.ruta}
                  end={item.ruta === '/app'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-boton px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-gradient-to-r from-primario to-primario-fuerte text-white shadow-glow' : 'text-tinta-suave hover:bg-superficie-alta hover:text-tinta',
                    )
                  }
                >
                  <item.icono size={18} />
                  {!colapsado && <span className="flex-1">{t(item.etiqueta)}</span>}
                  {item.badge === 'alertas' && (
                    <Suspense fallback={null}>
                      <BadgeAlertas />
                    </Suspense>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-dvh bg-fondo text-tinta">
      {/* ===== Sidebar (desktop) ===== */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-borde bg-superficie p-3 transition-all lg:flex',
          colapsado ? 'w-[72px]' : 'w-[260px]',
        )}
      >
        <div className="mb-4 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primario to-primario-fuerte">
            <Activity size={18} className="text-white" />
          </div>
          {!colapsado && (
            <div className="leading-tight">
              <div className="font-semibold">AYNI HEALTH</div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-tinta-suave">{t('shell.subtitulo')}</div>
            </div>
          )}
        </div>
        {contenidoSidebar}
        <button
          type="button"
          onClick={() => setColapsado((v) => !v)}
          className="mt-2 flex items-center justify-center rounded-boton py-2 text-tinta-suave hover:text-tinta"
          aria-label={colapsado ? t('shell.expandir') : t('shell.colapsar')}
        >
          {colapsado ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </aside>

      {/* ===== Drawer (móvil) ===== */}
      <Drawer abierto={drawerAbierto} alCerrar={() => setDrawerAbierto(false)} titulo="AYNI HEALTH">
        <div onClick={() => setDrawerAbierto(false)}>{contenidoSidebar}</div>
      </Drawer>

      {/* ===== Contenido principal ===== */}
      <div className={cn('flex min-h-dvh flex-col', colapsado ? 'lg:pl-[72px]' : 'lg:pl-[260px]')}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-borde bg-superficie/90 px-4 py-2.5 backdrop-blur">
          <button type="button" onClick={() => setDrawerAbierto(true)} className="rounded-boton p-2 text-tinta lg:hidden" aria-label={t('shell.abrirMenu')}>
            <Menu size={20} />
          </button>
          <div className="font-serif text-lg font-semibold">{t('shell.titulo')}</div>

          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setPaletteAbierto(true)} className="rounded-boton p-2 text-tinta-suave hover:text-tinta" aria-label={t('shell.buscar')}>
              <Search size={18} />
            </button>
            <div className="hidden text-right font-mono text-xs text-tinta-suave md:block">
              <div>{reloj.hora}</div>
              <div>{reloj.fecha}</div>
            </div>
            <div className="hidden sm:block">
              <Suspense fallback={null}>
                <IndicadorSincronizacion />
              </Suspense>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/registros')}
              className="flex items-center gap-1.5 rounded-boton bg-gradient-to-r from-primario to-primario-fuerte px-3 py-2 text-sm font-semibold text-white shadow-glow"
            >
              <Plus size={16} /> <span className="hidden sm:inline">{t('shell.registrar')}</span>
            </button>
            <button type="button" onClick={alternarModo} className="rounded-boton p-2 text-tinta-suave hover:text-tinta" aria-label={t('shell.alternarModo')}>
              {modoEfectivo === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <select
              className="hidden rounded-boton border border-borde bg-superficie px-1.5 py-1 text-xs text-tinta sm:block"
              value={idioma}
              onChange={(e) => fijarIdioma(e.target.value)}
              aria-label={t('shell.idioma')}
            >
              {IDIOMAS.map((i) => <option key={i} value={i}>{i.toUpperCase()}</option>)}
            </select>
            <Suspense fallback={null}>
              <PanelNotificaciones />
            </Suspense>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primario to-primario-fuerte text-xs font-semibold text-white">
                {usuario?.nombre?.charAt(0) ?? 'A'}
              </div>
              <div className="hidden text-xs leading-tight md:block">
                <div className="font-medium text-tinta">{usuario?.nombre ?? 'Administrador'}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-tinta-suave">{usuario?.rol ?? 'administrador'}</div>
              </div>
              <button type="button" onClick={cerrarSesion} className="hidden text-xs text-tinta-suave hover:text-tinta sm:inline">
                {t('shell.salir')}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 lg:pb-6">
          {RUTAS_DE_DATOS.some((r) => ubicacion.pathname.startsWith(r)) && (
            <Suspense fallback={null}>
              <BarraContextoTripulante />
            </Suspense>
          )}
          <Outlet />
        </main>
      </div>

      {/* Barra inferior (móvil) */}
      <div className="lg:hidden">
        <BarraInferior
          activo="dashboard"
          alCambiar={(id) => navigate({ dashboard: '/app', monitor: '/app/monitor', registrar: '/app/registros', nutricion: '/app/nutricion', mas: '/app/configuracion' }[id])}
          destinos={[
            { id: 'dashboard', etiqueta: t('movil.inicio'), icono: <LayoutDashboard size={20} /> },
            { id: 'monitor', etiqueta: t('movil.monitor'), icono: <HeartPulse size={20} /> },
            { id: 'registrar', etiqueta: t('movil.registrar'), icono: <Plus size={24} />, destacado: true },
            { id: 'nutricion', etiqueta: t('movil.nutricion'), icono: <Leaf size={20} /> },
            { id: 'mas', etiqueta: t('movil.mas'), icono: <User size={20} /> },
          ]}
        />
      </div>

      {/* Buscador global (Ctrl/Cmd + K) */}
      <CommandPalette abierto={paletteAbierto} alCerrar={() => setPaletteAbierto(false)} />

      {/* Recorrido de bienvenida (una sola vez) */}
      <Suspense fallback={null}>
        <Tour />
      </Suspense>
    </div>
  )
}
