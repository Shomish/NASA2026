/**
 * @fileoverview Prueba de regresión del bucle infinito de renderizado.
 * Monta el shell completo (router + store + TanStack Query + tema) y navega por
 * todas las rutas del menú. Falla ante cualquier error de React o ante la firma
 * del bucle de Zustand ("Maximum update depth exceeded" / "getSnapshot should be cached").
 *
 * Regresión del Paso 0: los selectores de Zustand que devolvían arreglos/objetos
 * nuevos en cada render provocaban un bucle infinito al entrar en los módulos.
 * @module app/integracion.test
 */

// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Router } from './router.jsx'
import { ProveedorTema } from '../presentacion/sistema/indice.js'
import { useAlmacenSesion } from '../features/auth/almacenSesion.js'

// Polyfills mínimos que jsdom no implementa y algunos módulos necesitan.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (consulta) => ({ matches: false, media: consulta, addEventListener: () => {}, removeEventListener: () => {} })
}

// Mocks de librerías pesadas/no esenciales para el entorno jsdom.
vi.mock('cmdk', () => {
  const componenteVacio = () => null
  const Command = Object.assign(componenteVacio, {
    Dialog: componenteVacio,
    Input: componenteVacio,
    List: componenteVacio,
    Empty: componenteVacio,
    Group: componenteVacio,
    Item: componenteVacio,
  })
  return { Command }
})

vi.mock('recharts', () => {
  const stub = () => null
  return {
    RadialBarChart: stub, RadialBar: stub, PolarAngleAxis: stub, ResponsiveContainer: stub,
    AreaChart: stub, Area: stub, XAxis: stub, YAxis: stub, Tooltip: stub,
    PieChart: stub, Pie: stub, Cell: stub,
  }
})

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: () => () => null }),
  AnimatePresence: ({ children }) => children,
}))

/** Rutas del menú lateral (todas las que puede ver un administrador). */
const RUTAS = [
  '/app', '/app/monitor', '/app/tripulacion', '/app/registros', '/app/usuarios',
  '/app/signos', '/app/salud-integral', '/app/nutricion', '/app/historial',
  '/app/diario', '/app/alertas', '/app/calendario', '/app/chat-ia',
  '/app/presentacion', '/app/configuracion', '/app/ayuda',
]

/** Firma del bucle de renderizado que queremos detectar. */
const FIRMA_BUCLE = /Maximum update depth exceeded|getSnapshot should be cached|The above error occurred|An error occurred in the <[A-Za-z]+> component/

/**
 * Renderiza el router completo en una ruta concreta.
 * @param {string} ruta - Ruta a renderizar.
 * @returns {import('@testing-library/react').RenderResult} Resultado.
 */
function renderizar(ruta) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <ProveedorTema>
      <QueryClientProvider client={cliente}>
        <MemoryRouter initialEntries={[ruta]}>
          <Router />
        </MemoryRouter>
      </QueryClientProvider>
    </ProveedorTema>,
  )
}

describe('regresión: navegación sin bucle de renderizado', () => {
  afterEach(() => {
    cleanup()
  })

  it('monta el shell y navega por todas las rutas del menú sin errores de React', async () => {
    // Sesión de administrador en memoria (sin red ni refresh).
    useAlmacenSesion.getState().iniciar('token-de-prueba', {
      id: 1, nombre: 'Administrador', email: 'admin@ayni.health', rol: 'administrador',
    })

    const errores = []
    const errorSpy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      errores.push(args.map((a) => (typeof a === 'string' ? a : String(a?.message ?? a))).join(' '))
    })

    for (const ruta of RUTAS) {
      renderizar(ruta)
      // Flush de efectos y resolución de los módulos lazy.
      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
      await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
      cleanup()
    }

    errorSpy.mockRestore()

    const conBucle = errores.filter((e) => FIRMA_BUCLE.test(e))
    expect(conBucle).toHaveLength(0)
  })
})
