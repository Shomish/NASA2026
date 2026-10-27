/**
 * @fileoverview Modal de confirmación (borrados y acciones irreversibles).
 * @module features/gestion/componentes/ConfirmarModal
 */

import { AlertTriangle } from 'lucide-react'
import { Modal, Boton } from '../../../presentacion/sistema/indice.js'

/**
 * Modal de confirmación.
 * @param {object} props - Propiedades.
 * @param {boolean} props.abierto - Visible.
 * @param {() => void} props.alCancelar - Cierra sin confirmar.
 * @param {() => void} props.alConfirmar - Ejecuta la acción.
 * @param {string} props.titulo - Título.
 * @param {string} [props.mensaje] - Cuerpo.
 * @param {boolean} [props.confirmando] - Muestra spinner en el botón.
 * @returns {import('react').JSX.Element | null} Modal.
 */
export function ConfirmarModal({ abierto, alCancelar, alConfirmar, titulo, mensaje, confirmando = false }) {
  return (
    <Modal abierto={abierto} alCerrar={alCancelar} titulo={titulo} tituloId="confirmar-titulo">
      <div className="space-y-4">
        {mensaje && (
          <div className="flex items-start gap-3 rounded-tarjeta border border-critico/40 bg-critico/10 p-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-critico" />
            <p className="text-sm text-tinta">{mensaje}</p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={alCancelar} disabled={confirmando}>
            Cancelar
          </Boton>
          <Boton variante="peligro" onClick={alConfirmar} disabled={confirmando}>
            {confirmando ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              'Confirmar'
            )}
          </Boton>
        </div>
      </div>
    </Modal>
  )
}
