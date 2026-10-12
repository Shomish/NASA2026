/**
 * @fileoverview Registro de temas disponibles.
 * @module presentacion/sistema/temas
 */

import { temaCusco } from './cusco.js'
import { temaSacsayhuaman } from './sacsayhuaman.js'
import { temaCosmos } from './cosmos.js'

/**
 * @typedef {object} Tema
 * @property {string} id - Identificador único del tema.
 * @property {string} nombre - Nombre visible.
 * @property {string} descripcion - Descripción corta.
 * @property {Record<string, string>} oscuro - Tokens en modo oscuro (canales RGB).
 * @property {Record<string, string>} claro - Tokens en modo claro (canales RGB).
 * @property {string[]} series - Secuencia de colores para gráficos.
 */

/**
 * Lista de temas disponibles.
 * @type {Tema[]}
 */
export const temas = [temaCusco, temaSacsayhuaman, temaCosmos]

/**
 * Obtiene un tema por su identificador.
 * @param {string} id - Identificador del tema.
 * @returns {Tema} Tema encontrado o el tema por defecto (Cusco).
 */
export function obtenerTema(id) {
  return temas.find((t) => t.id === id) ?? temaCusco
}

export { temaCusco, temaSacsayhuaman, temaCosmos }
