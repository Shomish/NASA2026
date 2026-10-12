/**
 * @fileoverview Componente ErrorBoundary
 * Captura errores de render de toda la aplicación y muestra una pantalla de
 * fallback visible (nunca una pantalla negra muda). Es la última barrera de
 * contención ante cualquier excepción no controlada en el árbol de React.
 * @module presentacion/componentes/ErrorBoundary
 */

import { Component } from 'react'
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react'

/** Nombre de la base de datos local que usa la aplicación. */
const NOMBRE_BASE = 'salud_astronauta_db'

/**
 * Boundary de errores global.
 * Captura errores de renderizado/ciclo de vida y ofrece una recuperación visible.
 */
export default class ErrorBoundary extends Component {
  /**
   * @param {object} props - Propiedades del componente.
   */
  constructor(props) {
    super(props)
    this.state = { error: null, hasError: false, restableciendo: false }
  }

  /**
   * Actualiza el estado al producirse un error.
   * @param {Error} error - Error capturado.
   * @returns {object} Estado con el error.
   */
  static getDerivedStateFromError(error) {
    return { error, hasError: true }
  }

  /**
   * Registra el error en consola para diagnóstico.
   * @param {Error} error - Error capturado.
   * @param {object} info - Información del stack de componentes.
   */
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Error no controlado:', error, info)
  }

  /**
   * Reinicia la aplicación recargando la página.
   */
  _recargar = () => {
    window.location.reload()
  }

  /**
   * Borra los datos locales (IndexedDB y localStorage) y recarga.
   * Permite salir de un estado corrupto persistente.
   */
  _restablecerDatos = async () => {
    this.setState({ restableciendo: true })
    try {
      if (window.indexedDB?.databases) {
        const bases = await window.indexedDB.databases()
        for (const base of bases) {
          if (base.name === NOMBRE_BASE) {
            await new Promise((resolver) => {
              const solicitud = window.indexedDB.deleteDatabase(NOMBRE_BASE)
              solicitud.onsuccess = () => resolver()
              solicitud.onerror = () => resolver()
              solicitud.onblocked = () => resolver()
            })
          }
        }
      }
      try {
        window.localStorage?.clear()
      } catch {
        /* localStorage puede no estar disponible; se ignora. */
      }
    } finally {
      window.location.reload()
    }
  }

  /**
   * Renderiza el fallback o los hijos.
   * @returns {import('react').ReactNode} Árbol de componentes.
   */
  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-6">
        <div className="max-w-md w-full bg-[#111827] border border-[#374151] rounded-2xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle size={28} className="text-rose-400" />
          </div>
          <h1 className="text-xl font-semibold text-[#F9FAFB]">Algo salió mal</h1>
          <p className="text-sm text-[#9CA3AF]">
            Ocurrió un error inesperado al cargar la aplicación. Intenta recargar; si persiste,
            restablece los datos locales.
          </p>
          <pre className="text-left text-xs font-mono text-rose-300 bg-[#0B0F19] border border-[#374151] rounded-lg p-3 overflow-x-auto max-h-40">
            {this.state.error?.message ?? 'Error desconocido'}
          </pre>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={this._recargar}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm"
            >
              <RotateCcw size={16} />
              Recargar aplicación
            </button>
            <button
              type="button"
              onClick={this._restablecerDatos}
              disabled={this.state.restableciendo}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-medium text-sm disabled:opacity-60"
            >
              <Trash2 size={16} />
              {this.state.restableciendo ? 'Restableciendo…' : 'Restablecer datos locales'}
            </button>
          </div>
        </div>
      </div>
    )
  }
}
