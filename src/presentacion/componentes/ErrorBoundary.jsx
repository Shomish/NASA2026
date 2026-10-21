/**
 * @fileoverview Componente ErrorBoundary
 * Captura errores de render de toda la aplicación y muestra una pantalla de
 * fallback visible (nunca una pantalla negra muda). Ofrece recarga y un
 * restablecimiento de datos locales con confirmación y descarga de respaldo.
 * @module presentacion/componentes/ErrorBoundary
 */

import { Component } from 'react'
import { AlertTriangle, RotateCcw, Trash2, Download, X } from 'lucide-react'

/** Nombre de la base de datos local que usa la aplicación. */
const NOMBRE_BASE = 'salud_astronauta_db'

/**
 * Boundary de errores global.
 * Captura errores de renderizado/ciclo de vida y ofrece recuperación visible.
 */
export default class ErrorBoundary extends Component {
  /**
   * @param {object} props - Propiedades del componente.
   */
  constructor(props) {
    super(props)
    this.state = { error: null, hasError: false, restableciendo: false, mostrarConfirmacion: false }
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
   * Lee los datos locales almacenados en IndexedDB.
   * @returns {Promise<object>} Datos de la base (tripulacion e historial).
   */
  _leerDatosLocales = () => {
    return new Promise((resolver) => {
      const solicitud = window.indexedDB.open(NOMBRE_BASE)
      solicitud.onsuccess = () => {
        const base = solicitud.result
        const resultado = { tripulacion: [], historial: [] }
        try {
          const tx = base.transaction(['tripulacion', 'historial'], 'readonly')
          const reqT = tx.objectStore('tripulacion').getAll()
          const reqH = tx.objectStore('historial').getAll()
          tx.oncomplete = () => {
            resultado.tripulacion = reqT.result ?? []
            resultado.historial = reqH.result ?? []
            resolver(resultado)
          }
          tx.onerror = () => resolver(resultado)
        } catch {
          resolver(resultado)
        } finally {
          base.close()
        }
      }
      solicitud.onerror = () => resolver({ tripulacion: [], historial: [] })
    })
  }

  /**
   * Descarga una copia de los datos locales en formato JSON.
   */
  _descargarCopia = async () => {
    const datos = await this._leerDatosLocales()
    const contenido = JSON.stringify(datos, null, 2)
    const blob = new Blob([contenido], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `respaldo-ayni-health-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(enlace)
    enlace.click()
    document.body.removeChild(enlace)
    URL.revokeObjectURL(url)
  }

  /**
   * Muestra el diálogo de confirmación antes de borrar.
   */
  _abrirConfirmacion = () => {
    this.setState({ mostrarConfirmacion: true })
  }

  /**
   * Cierra el diálogo de confirmación.
   */
  _cerrarConfirmacion = () => {
    this.setState({ mostrarConfirmacion: false })
  }

  /**
   * Borra los datos locales (IndexedDB y localStorage) y recarga.
   */
  _confirmarRestablecer = () => {
    this.setState({ restableciendo: true, mostrarConfirmacion: false })
    const borrarBase = () =>
      new Promise((resolver) => {
        const solicitud = window.indexedDB.deleteDatabase(NOMBRE_BASE)
        solicitud.onsuccess = () => resolver()
        solicitud.onerror = () => resolver()
        solicitud.onblocked = () => resolver()
      })
    Promise.resolve(borrarBase())
      .then(() => {
        try {
          window.localStorage?.clear()
        } catch {
          /* localStorage puede no estar disponible; se ignora. */
        }
      })
      .finally(() => window.location.reload())
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
          <div className="w-14 h-14 rounded-xl bg-critico/15 border border-rose-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle size={28} className="text-critico" />
          </div>
          <h1 className="text-xl font-semibold text-[#F9FAFB]">Algo salió mal</h1>
          <p className="text-sm text-[#9CA3AF]">
            Ocurrió un error inesperado al cargar la aplicación. Intenta recargar; si persiste,
            restablece los datos locales.
          </p>
          <pre className="text-left text-xs font-mono text-critico bg-[#0B0F19] border border-[#374151] rounded-lg p-3 overflow-x-auto max-h-40">
            {this.state.error?.message ?? 'Error desconocido'}
          </pre>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={this._recargar}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primario hover:bg-primario-fuerte text-white font-medium text-sm"
            >
              <RotateCcw size={16} />
              Recargar aplicación
            </button>
            <button
              type="button"
              onClick={this._abrirConfirmacion}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-superficie-alta hover:bg-superficie-alta border border-borde text-tinta font-medium text-sm"
            >
              <Trash2 size={16} />
              Restablecer datos locales
            </button>
          </div>
        </div>

        {/* Diálogo de confirmación */}
        {this.state.mostrarConfirmacion && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-restablecer"
          >
            <div className="max-w-md w-full bg-[#111827] border border-[#374151] rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <h2 id="titulo-restablecer" className="text-lg font-semibold text-[#F9FAFB]">
                  Restablecer datos locales
                </h2>
                <button type="button" onClick={this._cerrarConfirmacion} className="text-tinta-suave hover:text-tinta" aria-label="Cerrar">
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-[#9CA3AF]">
                Se eliminarán todos los datos guardados en este navegador (tripulantes, signos
                vitales, sueño, notas y alertas). Esta acción no se puede deshacer. Te recomendamos
                descargar una copia de respaldo antes de continuar.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={this._descargarCopia}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-superficie-alta hover:bg-superficie-alta border border-borde text-tinta font-medium text-sm"
                >
                  <Download size={16} />
                  Descargar copia (JSON)
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={this._cerrarConfirmacion}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-superficie-alta hover:bg-superficie-alta text-tinta font-medium text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={this._confirmarRestablecer}
                    disabled={this.state.restableciendo}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-critico hover:bg-critico text-white font-medium text-sm disabled:opacity-60"
                  >
                    {this.state.restableciendo ? 'Restableciendo…' : 'Sí, restablecer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
}
