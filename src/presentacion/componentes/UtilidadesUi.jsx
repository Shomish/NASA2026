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
  optimo: { texto: 'text-exito', fondo: 'bg-exito', borde: 'border-emerald-500/40', suave: 'bg-exito/10' },
  atencion: { texto: 'text-advertencia', fondo: 'bg-advertencia', borde: 'border-orange-500/40', suave: 'bg-advertencia/10' },
  critico: { texto: 'text-critico', fondo: 'bg-critico', borde: 'border-rose-500/40', suave: 'bg-critico/10' },
  neutro: { texto: 'text-tinta-suave', fondo: 'bg-neutral-500', borde: 'border-borde', suave: 'bg-superficie-alta' },
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
    <div className={`bg-superficie/80 border border-borde rounded-2xl backdrop-blur-sm ${clase}`}>
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
      <div className="w-9 h-9 rounded-lg bg-primario/15 border border-primario/20 flex items-center justify-center text-primario">
        {icono}
      </div>
      <div>
        <h3 className="font-semibold text-tinta leading-tight">{titulo}</h3>
        {subtitulo && <p className="text-xs text-tinta-suave font-mono">{subtitulo}</p>}
      </div>
    </div>
  )
}
