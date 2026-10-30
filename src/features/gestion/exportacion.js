/**
 * @fileoverview Exportación CSV de registros con protección contra inyección de fórmulas.
 * Las celdas que empiezan con =, +, - o @ se prefijan con una comilla simple.
 * @module features/gestion/exportacion
 */

/**
 * Protege una celda contra inyección de fórmulas en hojas de cálculo.
 * @param {unknown} valor - Valor de la celda.
 * @returns {string} Celda protegida.
 */
export function protegerCelda(valor) {
  const texto = valor === null || valor === undefined ? '' : String(valor)
  if (/^[=+\-@]/.test(texto)) return `'${texto}`
  return texto
}

/**
 * Serializa registros a CSV (con BOM UTF-8 y protección de celdas).
 * @param {object[]} filas - Filas de datos.
 * @param {string[]} columnas - Claves de columna.
 * @returns {string} Contenido CSV.
 */
export function aCsv(filas, columnas) {
  const cabecera = columnas.map(protegerCelda).join(',')
  const lineas = filas.map((f) => columnas.map((c) => protegerCelda(f[c])).join(','))
  return `\uFEFF${[cabecera, ...lineas].join('\n')}`
}

/**
 * Descarga un CSV en el navegador.
 * @param {string} contenido - Contenido CSV.
 * @param {string} nombreArchivo - Nombre del archivo.
 */
export function descargarCsv(contenido, nombreArchivo) {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}
