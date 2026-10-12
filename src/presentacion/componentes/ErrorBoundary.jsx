/**
 * @fileoverview Componente ErrorBoundary
 * Captura errores de render de toda la aplicación y muestra una pantalla de
 * fallback visible (nunca una pantalla negra muda). Es la última barrera de
 * contención ante cualquier excepción no controlada en el árbol de React.
 * @module presentacion/componentes/ErrorBoundary
 */

import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

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
    this.state = { error: null, hasError: false }
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
            Ocurrió un error inesperado al cargar la aplicación. Recarga la página para continuar.
          </p>
          <pre className="text-left text-xs font-mono text-rose-300 bg-[#0B0F19] border border-[#374151] rounded-lg p-3 overflow-x-auto max-h-40">
            {this.state.error?.message ?? 'Error desconocido'}
          </pre>
          <button
            type="button"
            onClick={this._recargar}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm"
          >
            <RotateCcw size={16} />
            Recargar aplicación
          </button>
        </div>
      </div>
    )
  }
}
