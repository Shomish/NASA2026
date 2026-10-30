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
  Presentation,
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

/** Rutas de módulos de datos (muestran la barra de contexto de tripulante). */
const RUTAS_DE_DATOS = [
  '/app/monitor', '/app/signos', '/app/salud-integral', '/app/calendario',
  '/app/nutricion', '/app/registros', '/app/historial', '/app/diario',
  '/app/alertas', '/app/chat-ia',
]

/** Elementos de navegación del sidebar (secciones). */
const NAVEGACION = [
  { seccion: 'Principal', items: [{ id: 'dashboard', etiqueta: 'Dashboard', icono: LayoutDashboard, ruta: '/app' }] },
  {
    seccion: 'Monitoreo',
    items: [
      { id: 'monitor', etiqueta: 'Monitor de salud', icono: HeartPulse, ruta: '/app/monitor' },
      { id: 'cuerpo', etiqueta: 'Mi cuerpo', icono: PersonStanding, ruta: '/app/cuerpo' },
      { id: 'signos', etiqueta: 'Signos vitales', icono: Activity, ruta: '/app/signos' },
      { id: 'salud-integral', etiqueta: 'Salud integral', icono: Brain, ruta: '/app/salud-integral' },
      { id: 'calendario', etiqueta: 'Calendario', icono: Calendar, ruta: '/app/calendario' },
    ],
  },
  { seccion: 'Nutrición', items: [{ id: 'nutricion', etiqueta: 'Nutrición inteligente', icono: Leaf, ruta: '/app/nutricion' }] },
  {
    seccion: 'Tripulación',
    items: [
      { id: 'registros', etiqueta: 'Registros', icono: ClipboardList, ruta: '/app/registros' },
      { id: 'tripulacion', etiqueta: 'Tripulantes', icono: Users, ruta: '/app/tripulacion' },
      { id: 'historial', etiqueta: 'Historial', icono: History, ruta: '/app/historial' },
      { id: 'diario', etiqueta: 'Diario', icono: NotebookPen, ruta: '/app/diario' },
    ],
  },
  {
    seccion: 'Sistema',
    items: [
      { id: 'alertas', etiqueta: 'Alertas', icono: Bell, ruta: '/app/alertas', badge: 'alertas' },
      { id: 'chat-ia', etiqueta: 'Médico de IA', icono: Bot, ruta: '/app/chat-ia' },
      { id: 'usuarios', etiqueta: 'Usuarios', icono: UserCog, ruta: '/app/usuarios', soloAdmin: true },
      { id: 'auditoria', etiqueta: 'Auditoría', icono: ScrollText, ruta: '/app/auditoria', soloAdmin: true },
      { id: 'presentacion', etiqueta: 'Presentación', icono: Presentation, ruta: '/app/presentacion' },
      { id: 'fundamento', etiqueta: 'Fundamento científico', icono: BookOpen, ruta: '/app/fundamento' },
      { id: 'configuracion', etiqueta: 'Configuración', icono: Settings, ruta: '/app/configuracion' },
      { id: 'ayuda', etiqueta: 'Ayuda', icono: HelpCircle, ruta: '/app/ayuda' },
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
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-tinta-suave">{grupo.seccion}</div>
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
                  {!colapsado && <span className="flex-1">{item.etiqueta}</span>}
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
              <div className="font-mono text-[9px] uppercase tracking-widest text-tinta-suave">Monitor autónomo</div>
            </div>
          )}
        </div>
        {contenidoSidebar}
        <button
          type="button"
          onClick={() => setColapsado((v) => !v)}
          className="mt-2 flex items-center justify-center rounded-boton py-2 text-tinta-suave hover:text-tinta"
          aria-label={colapsado ? 'Expandir' : 'Colapsar'}
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
          <button type="button" onClick={() => setDrawerAbierto(true)} className="rounded-boton p-2 text-tinta lg:hidden" aria-label="Abrir menú">
            <Menu size={20} />
          </button>
          <div className="font-serif text-lg font-semibold">Monitor de salud</div>

          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setPaletteAbierto(true)} className="rounded-boton p-2 text-tinta-suave hover:text-tinta" aria-label="Buscar (Ctrl+K)">
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
              <Plus size={16} /> <span className="hidden sm:inline">Registrar medición</span>
            </button>
            <button type="button" onClick={alternarModo} className="rounded-boton p-2 text-tinta-suave hover:text-tinta" aria-label="Alternar modo">
              {modoEfectivo === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Suspense fallback={null}>
              <PanelNotificaciones />
            </Suspense>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primario to-primario-fuerte text-xs font-semibold text-white">
                {usuario?.nombre?.charAt(0) ?? 'A'}
              </div>
              <button type="button" onClick={cerrarSesion} className="hidden text-xs text-tinta-suave hover:text-tinta sm:inline">
                Salir
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
            { id: 'dashboard', etiqueta: 'Inicio', icono: <LayoutDashboard size={20} /> },
            { id: 'monitor', etiqueta: 'Monitor', icono: <HeartPulse size={20} /> },
            { id: 'registrar', etiqueta: 'Registrar', icono: <Plus size={24} />, destacado: true },
            { id: 'nutricion', etiqueta: 'Nutrición', icono: <Leaf size={20} /> },
            { id: 'mas', etiqueta: 'Más', icono: <User size={20} /> },
          ]}
        />
      </div>

      {/* Buscador global (Ctrl/Cmd + K) */}
      <CommandPalette abierto={paletteAbierto} alCerrar={() => setPaletteAbierto(false)} />
    </div>
  )
}
