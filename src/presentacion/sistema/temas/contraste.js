/**
 * @fileoverview Utilidades de contraste WCAG (con colord).
 * Permiten verificar accesibilidad AA entre combinaciones de color.
 * @module presentacion/sistema/temas/contraste
 */

import { colord } from 'colord'

/**
 * Calcula la luminancia relativa de un color RGB (0-255 por canal).
 * @param {{r: number, g: number, b: number}} rgb - Color RGB.
 * @returns {number} Luminancia relativa.
 */
function luminancia(rgb) {
  const canal = (c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * canal(rgb.r) + 0.7152 * canal(rgb.g) + 0.0722 * canal(rgb.b)
}

/**
 * Calcula el ratio de contraste WCAG entre dos colores (cualquier formato CSS).
 * @param {string} colorA - Color A.
 * @param {string} colorB - Color B.
 * @returns {number} Ratio de contraste (1 a 21).
 */
export function contrasteWCAG(colorA, colorB) {
  const la = luminancia(colord(colorA).toRgb())
  const lb = luminancia(colord(colorB).toRgb())
  const [mayor, menor] = la >= lb ? [la, lb] : [lb, la]
  return (mayor + 0.05) / (menor + 0.05)
}

/**
 * Indica si una combinación cumple el contraste mínimo WCAG AA.
 * @param {string} colorA - Color A.
 * @param {string} colorB - Color B.
 * @param {boolean} [textoGrande=false] - Si es texto grande (umbral 3:1).
 * @returns {boolean} Verdadero si cumple AA.
 */
export function cumpleAA(colorA, colorB, textoGrande = false) {
  const umbral = textoGrande ? 3 : 4.5
  return contrasteWCAG(colorA, colorB) >= umbral
}

/**
 * Convierte un canal RGB ("r g b") a hexadecimal (#rrggbb).
 * @param {string} canal - Canal RGB separado por espacios.
 * @returns {string} Color hexadecimal.
 */
export function rgbAHex(canal) {
  const [r, g, b] = canal.split(' ').map(Number)
  return colord({ r, g, b }).toHex()
}

/**
 * Convierte un color hexadecimal a canal RGB ("r g b").
 * @param {string} hex - Color hexadecimal.
 * @returns {string} Canal RGB separado por espacios.
 */
export function hexARgb(hex) {
  const { r, g, b } = colord(hex).toRgb()
  return `${r} ${g} ${b}`
}
