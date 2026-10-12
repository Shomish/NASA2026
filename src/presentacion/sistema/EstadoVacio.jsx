/**
 * @fileoverview Componente base EstadoVacio (Empty State)
 * Estado vacío ilustrado con mensaje amable y acción opcional.
 * @module presentacion/sistema/EstadoVacio
 */

import { cn } from './cn.js'
import { Boton } from './Boton.jsx'

/**
 * Estado vacío reutilizable.
 * @param {object} props - Propiedades.
 * @param {import('react').ReactNode} props.icono - Icono ilustrativo (lucide).
 * @param {string} props.titulo - Título.
 * @param {string} [props.descripcion] - Descripción amable.
 * @param {{etiqueta: string, alHacerClic: () => void}} [props.accion] - Acción opcional.
 * @param {string} [props.className] - Clases adicionales.
 * @returns {import('react').JSX.Element} Estado vacío.
 */
export function EstadoVacio({ icono, titulo, descripcion, accion, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-superficie-alta text-tinta-suave">
        {icono}
      </div>
      <div className="space-y-1">
        <h3 className="font-medium text-tinta">{titulo}</h3>
        {descripcion && <p className="max-w-sm text-sm text-tinta-suave">{descripcion}</p>}
      </div>
      {accion && (
        <Boton variante="primario" tamaño="sm" onClick={accion.alHacerClic}>
          {accion.etiqueta}
        </Boton>
      )}
    </div>
  )
}
