/**
 * @fileoverview Componente TarjetaTabla
 * Versión móvil de tabla: transforma filas en tarjetas apilables.
 * @module presentacion/sistema/movil/TarjetaTabla
 */

import { cn } from '../cn.js'

/**
 * Tabla apilable para móvil.
 * @param {object} props - Propiedades.
 * @param {Array<{clave: string, etiqueta: string}>} props.columnas - Definición de columnas.
 * @param {Array<object>} props.filas - Datos de las filas.
 * @param {string} [props.className] - Clases adicionales.
 * @returns {import('react').JSX.Element} Lista de tarjetas.
 */
export function TarjetaTabla({ columnas, filas = [], className }) {
  if (filas.length === 0) {
    return <p className="text-sm text-tinta-suave">Sin registros.</p>
  }
  return (
    <div className={cn('space-y-2', className)}>
      {filas.map((fila, indice) => (
        <div key={indice} className="rounded-tarjeta border border-borde bg-superficie p-4">
          {columnas.map((columna) => (
            <div key={columna.clave} className="flex items-center justify-between gap-3 py-1 text-sm">
              <span className="text-tinta-suave">{columna.etiqueta}</span>
              <span className="text-right font-mono text-tinta">{fila[columna.clave] ?? '—'}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
