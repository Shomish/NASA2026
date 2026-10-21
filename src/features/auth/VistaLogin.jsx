/**
 * @fileoverview Vista de Login.
 * Panel izquierdo (hero "de la tierra al cosmos") + panel derecho (formulario).
 * @module features/auth/VistaLogin
 */

import { lazy, Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Activity,
  Eye,
  EyeOff,
  HeartPulse,
  Lock,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Leaf,
  Brain,
} from 'lucide-react'
import { esquemaLogin } from './index.js'
import { apiLogin } from './api.js'
import { useAlmacenSesion } from './almacenSesion.js'
import { useTema } from '../../presentacion/sistema/tema.jsx'

// Partículas con carga diferida (no forman parte del bundle inicial de /login).
const ParticulasEstelares = lazy(() => import('./ParticulasEstelares.jsx'))

/**
 * Vista de login.
 * @returns {import('react').JSX.Element} Login.
 */
export function VistaLogin() {
  const navigate = useNavigate()
  const ubicacion = useLocation()
  const iniciar = useAlmacenSesion((s) => s.iniciar)
  const { temas, paleta, fijarPaleta, modoEfectivo, alternarModo } = useTema()

  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(esquemaLogin) })

  const modoDemo = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true'

  /**
   * Maneja el envío del formulario.
   * @param {{username: string, contrasena: string}} datos - Credenciales.
   */
  const alEnviar = async (datos) => {
    setError('')
    try {
      const sesion = await apiLogin(datos.username, datos.contrasena)
      iniciar(sesion.accessToken, sesion.usuario)
      const destino = ubicacion.state?.desde?.pathname ?? '/app'
      navigate(destino, { replace: true })
    } catch (e) {
      setError(e.message)
    }
  }

  /**
   * Autocompleta las credenciales de demostración.
   */
  const autocompletarDemo = () => {
    setValue('username', 'admin')
    setValue('contrasena', 'admin123')
  }

  const reducirMovimiento = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">
      {/* ============ Panel izquierdo (hero) ============ */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#1A103C] via-[#3A1F1B] to-[#C2603A] p-6 lg:w-[55%] lg:min-h-dvh">
        <div className="absolute inset-0 textura-andina opacity-40" />
        {!reducirMovimiento && (
          <Suspense fallback={null}>
            <ParticulasEstelares />
          </Suspense>
        )}

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8894F] to-[#C2603A] shadow-glow">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-white">AYNI HEALTH</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/70">Monitor autónomo · Cosmos andino</div>
          </div>
        </div>

        {/* Contenido central */}
        <div className="relative z-10 my-8 space-y-5">
          <h1 className="font-serif text-3xl font-bold leading-tight text-white lg:text-5xl">
            Cuida la salud de tu tripulación,{' '}
            <span className="bg-gradient-to-r from-[#E0B04F] to-[#2BB3A3] bg-clip-text text-transparent">incluso sin conexión.</span>
          </h1>
          <p className="max-w-md text-white/80">
            Signos vitales, nutrición andina, sueño, salud mental y un médico de IA que funciona sin
            depender de control de misión.
          </p>

          {/* Anillo Inti con dato real */}
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#E0B04F" strokeWidth="8" strokeDasharray="264" strokeDashoffset="0" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-lg font-bold text-white">100</span>
                <span className="font-mono text-[10px] text-white/70">/ 100</span>
              </div>
            </div>
            <div className="font-mono text-xs text-white/80">
              <div>Ana Quispe · Comandante</div>
              <div>Día 120 · SpO₂ 97%</div>
            </div>
          </div>

          {/* 4 mini-cards de vidrio esmerilado */}
          <div className="hidden grid-cols-2 gap-2 md:grid">
            {[
              { icono: <HeartPulse size={16} />, texto: 'Monitoreo vital autónomo' },
              { icono: <Leaf size={16} />, texto: 'Nutrición con superalimentos andinos' },
              { icono: <Brain size={16} />, texto: 'Sueño, salud mental y radiación' },
              { icono: <Sparkles size={16} />, texto: 'Médico de IA offline' },
            ].map((c) => (
              <div key={c.texto} className="flex items-center gap-2 rounded-tarjeta border border-white/20 bg-white/10 p-3 text-xs text-white backdrop-blur-sm">
                <span className="text-[#E0B04F]">{c.icono}</span>
                {c.texto}
              </div>
            ))}
          </div>
        </div>

        {/* Pie */}
        <div className="relative z-10 font-mono text-[10px] text-white/60">
          © 2026 AYNI HEALTH · NASA Space Apps Challenge · v1.0
        </div>
      </div>

      {/* ============ Panel derecho (formulario) ============ */}
      <div className="flex flex-1 items-center justify-center bg-fondo p-6 lg:w-[45%]">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-insignia border border-borde bg-superficie-alta px-2.5 py-1 text-xs text-tinta-suave">
              <ShieldCheck size={14} className="text-exito" /> Conexión segura
            </span>
            <div className="flex items-center gap-1">
              <select
                className="rounded-boton border border-borde bg-superficie px-2 py-1 text-xs text-tinta"
                value={paleta}
                onChange={(e) => fijarPaleta(e.target.value)}
                aria-label="Seleccionar paleta"
              >
                {temas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
              <button type="button" onClick={alternarModo} className="flex h-8 w-8 items-center justify-center rounded-boton border border-borde text-tinta-suave hover:text-tinta" aria-label="Alternar modo">
                {modoEfectivo === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold text-tinta">Bienvenido de nuevo</h2>
            <p className="text-sm text-tinta-suave">Ingresa tus credenciales para acceder al sistema.</p>
          </div>

          <form onSubmit={handleSubmit(alEnviar)} className="space-y-4" noValidate>
            <div>
              <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="usuario">Usuario</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta-suave" />
                <input
                  id="usuario"
                  type="text"
                  autoComplete="username"
                  className="h-11 w-full rounded-boton border border-borde bg-superficie-elevada pl-9 pr-3 text-base text-tinta placeholder:text-tinta-suave focus:outline-none focus:ring-2 focus:ring-primario"
                  placeholder="admin"
                  {...register('username')}
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-critico">{errors.username.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-tinta" htmlFor="contrasena">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta-suave" />
                <input
                  id="contrasena"
                  type={mostrarContrasena ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="h-11 w-full rounded-boton border border-borde bg-superficie-elevada pl-9 pr-10 text-base text-tinta placeholder:text-tinta-suave focus:outline-none focus:ring-2 focus:ring-primario"
                  placeholder="••••••••"
                  onKeyDown={(e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false)}
                  {...register('contrasena')}
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-tinta-suave hover:text-tinta"
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarContrasena ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.contrasena && <p className="mt-1 text-xs text-critico">{errors.contrasena.message}</p>}
              {capsLock && <p className="mt-1 text-xs text-advertencia-fuerte">Bloq Mayús activado</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-tinta-suave">
                <input type="checkbox" className="h-4 w-4 rounded border-borde" /> Recordar usuario
              </label>
              <a href="#" className="text-primario hover:underline">¿Olvidaste tu contraseña?</a>
            </div>

            {error && (
              <p className="rounded-boton border border-critico/40 bg-critico/10 px-3 py-2 text-sm text-critico" role="alert" aria-live="assertive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-boton bg-gradient-to-r from-[#E8894F] to-[#C2603A] text-base font-semibold text-white shadow-glow transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <>Ingresar al sistema →</>
              )}
            </button>
          </form>

          {modoDemo && (
            <div className="rounded-tarjeta border border-andino-dorado/40 bg-andino-dorado/10 p-3 text-sm">
              <div className="font-medium text-tinta">Acceso de demostración</div>
              <div className="mt-1 font-mono text-xs text-tinta-suave">admin / admin123</div>
              <button type="button" onClick={autocompletarDemo} className="mt-2 text-xs font-medium text-primario hover:underline">
                Autocompletar credenciales
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
