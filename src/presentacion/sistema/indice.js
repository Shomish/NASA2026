/**
 * @fileoverview Punto de entrada del sistema de diseño.
 * Reexporta tokens, utilidades, componentes base y componentes móviles.
 * @module presentacion/sistema
 */

export { cn } from './cn.js'
export { ProveedorTema, useTema } from './tema.jsx'
export { Boton } from './Boton.jsx'
export { Tarjeta } from './Tarjeta.jsx'
export { Insignia } from './Insignia.jsx'
export { Entrada } from './Entrada.jsx'
export { Modal } from './Modal.jsx'
export { Esqueleto } from './Esqueleto.jsx'
export { EstadoVacio } from './EstadoVacio.jsx'
export { ContenedorTostadas, toast } from './Tostada.jsx'
export { EditorTema } from './EditorTema.jsx'
export { temas, obtenerTema } from './temas/indice.js'
export { contrasteWCAG, cumpleAA, rgbAHex, hexARgb } from './temas/contraste.js'
export * from './movil/indice.js'
