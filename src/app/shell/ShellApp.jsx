/**
 * @fileoverview Shell de la aplicación autenticada (sidebar + topbar + contenido).
 * Desktop: sidebar colapsable. Móvil: drawer + barra inferior de 5 destinos.
 * @module app/shell/ShellApp
 */

import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Activity,
  Bell,
  Bot,
  Brain,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  HeartPulse,
  HelpCircle,
  History,
  LayoutDashboard,
  Leaf,
  Menu,
  Moon,
  NotebookPen,
  Plus,
  Presentation,
  Search,
  Settings,
  Sun,
  User,
  Users,
} from 'lucide-react'
import { cn } from '../../presentacion/sistema/cn.js'
import { useTema } from '../../presentacion/sistema/tema.jsx'
import { useAlmacenSesion } from '../../features/auth/almacenSesion.js'
import { apiLogout } from '../../features/auth/api.js'
import { useSaludStore } from '../../features/salud/almacen.js'
import { tripulacionInicial } from '../../datos/mockDatos.js'
import { Drawer } from '../../presentacion/sistema/movil/Drawer.jsx'
import { BarraInferior } from '../../presentacion/sistema/movil/BarraInferior.jsx'
import { CommandPalette } from './CommandPalette.jsx'

/** Elementos de navegación del sidebar (secciones). */
const NAVEGACION = [
  { seccion: 'Principal', items: [{ id: 'dashboard', etiqueta: 'Dashboard', icono: LayoutDashboard, ruta: '/app' }] },
  {
    seccion: 'Monitoreo',
    items: [
      { id: 'monitor', etiqueta: 'Monitor de salud', icono: HeartPulse, ruta: '/app/monitor' },
      { id: 'signos', etiqueta: 'Signos vitales', icono: Activity, ruta: '/app/signos' },
      { id: 'salud-integral', etiqueta: 'Salud integral', icono: Brain, ruta: '/app/salud-integral' },
      { id: 'calendario', etiqueta: 'Calendario', icono: Calendar, ruta: '/app/calendario' },
    ],
  },
  { seccion: 'Nutrición', items: [{ id: 'nutricion', etiqueta: 'Nutrición inteligente', icono: Leaf, ruta: '/app/nutricion' }] },
  {
    seccion: 'Tripulación',
    items: [
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
      { id: 'presentacion', etiqueta: 'Presentación', icono: Presentation, ruta: '/app/presentacion' },
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
    hora: ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    fecha: ahora.toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
  }
}

/**
 * Shell de la aplicación autenticada.
 * @returns {import('react').JSX.Element} Shell.
 */
export function ShellApp() {
  const navigate = useNavigate()
  const { modoEfectivo, alternarModo } = useTema()
  const usuario = useAlmacenSesion((s) => s.usuario)
  const cerrar = useAlmacenSesion((s) => s.cerrar)
  const [colapsado, setColapsado] = useState(false)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [paletteAbierto, setPaletteAbierto] = useState(false)
  const reloj = usarReloj()
  const alertasSinLeer = useSaludStore(
    (s) => s.historial.filter((r) => r.tipo === 'alerta' && !r.leida && r.personaId === s.personaId).length,
  )

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
    await apiLogout()
    cerrar()
    navigate('/login', { replace: true })
  }

  const contenidoSidebar = (
    <nav className="flex-1 space-y-5 overflow-y-auto">
      {NAVEGACION.map((grupo) => (
        <div key={grupo.seccion}>
          <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-tinta-suave">{grupo.seccion}</div>
          <div className="space-y-1">
            {grupo.items.map((item) => (
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
                {item.badge === 'alertas' && alertasSinLeer > 0 && (
                  <span className="rounded-full bg-critico px-1.5 py-0.5 text-[10px] font-bold text-white">{alertasSinLeer}</span>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
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
            <select className="hidden rounded-boton border border-borde bg-superficie-alta px-2 py-1.5 text-sm text-tinta sm:block" aria-label="Tripulante activo">
              {tripulacionInicial.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            <div className="hidden text-right font-mono text-xs text-tinta-suave md:block">
              <div>{reloj.hora}</div>
              <div className="capitalize">{reloj.fecha}</div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/monitor')}
              className="flex items-center gap-1.5 rounded-boton bg-gradient-to-r from-primario to-primario-fuerte px-3 py-2 text-sm font-semibold text-white shadow-glow"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Registrar medición</span>
            </button>
            <button type="button" onClick={alternarModo} className="rounded-boton p-2 text-tinta-suave hover:text-tinta" aria-label="Alternar modo">
              {modoEfectivo === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button type="button" className="relative rounded-boton p-2 text-tinta-suave hover:text-tinta" aria-label="Notificaciones">
              <Bell size={18} />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-critico" />
            </button>
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
          <Outlet />
        </main>
      </div>

      {/* Barra inferior (móvil) */}
      <div className="lg:hidden">
        <BarraInferior
          activo="dashboard"
          alCambiar={(id) => navigate({ dashboard: '/app', monitor: '/app/monitor', tripulacion: '/app/tripulacion', nutricion: '/app/nutricion', mas: '/app/configuracion' }[id])}
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
