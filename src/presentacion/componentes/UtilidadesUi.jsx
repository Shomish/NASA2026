/**
 * @fileoverview Componentes UI reutilizables (insignias, medidores, tarjetas).
 * @module presentacion/componentes/UtilidadesUi
 */

/** Colores por estado de salud (semántica Cosmos Andino). */
export const COLOR_ESTADO = {
  optimo: 'emerald',
  atencion: 'orange',
  critico: 'rose',
}

/** Clases de color por estado. */
export const CLASES_ESTADO = {
  optimo: { texto: 'text-emerald-400', fondo: 'bg-emerald-500', borde: 'border-emerald-500/40', suave: 'bg-emerald-500/10' },
  atencion: { texto: 'text-orange-400', fondo: 'bg-orange-500', borde: 'border-orange-500/40', suave: 'bg-orange-500/10' },
  critico: { texto: 'text-rose-400', fondo: 'bg-rose-500', borde: 'border-rose-500/40', suave: 'bg-rose-500/10' },
  neutro: { texto: 'text-neutral-400', fondo: 'bg-neutral-500', borde: 'border-neutral-700', suave: 'bg-neutral-800' },
}

/**
 * Insignia de estado.
 * @param {object} props - Propiedades.
 * @param {'optimo'|'atencion'|'critico'} props.estado - Estado.
 * @param {string} [props.etiqueta] - Etiqueta opcional.
 * @returns {import('react').JSX.Element} Insignia.
 */
export function InsigniaEstado({ estado, etiqueta }) {
  const clases = CLASES_ESTADO[estado] ?? CLASES_ESTADO.neutro
  const texto = etiqueta ?? { optimo: 'Óptimo', atencion: 'Atención', critico: 'Crítico' }[estado]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${clases.texto} ${clases.borde} ${clases.suave}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${clases.fondo}`} />
      {texto}
    </span>
  )
}

/**
 * Tarjeta contenedora flotante.
 * @param {object} props - Propiedades.
 * @param {import('react').ReactNode} props.children - Contenido.
 * @param {string} [props.clase] - Clases adicionales.
 * @returns {import('react').JSX.Element} Tarjeta.
 */
export function Tarjeta({ children, clase = '' }) {
  return (
    <div className={`bg-neutral-900/80 border border-neutral-800 rounded-2xl backdrop-blur-sm ${clase}`}>
      {children}
    </div>
  )
}

/**
 * Encabezado de panel con título e icono.
 * @param {object} props - Propiedades.
 * @param {import('react').ReactNode} props.icono - Icono Lucide.
 * @param {string} props.titulo - Título.
 * @param {string} [props.subtitulo] - Subtítulo.
 * @returns {import('react').JSX.Element} Encabezado.
 */
export function EncabezadoPanel({ icono, titulo, subtitulo }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-violet-400">
        {icono}
      </div>
      <div>
        <h3 className="font-semibold text-neutral-100 leading-tight">{titulo}</h3>
        {subtitulo && <p className="text-xs text-neutral-500 font-mono">{subtitulo}</p>}
      </div>
    </div>
  )
}
