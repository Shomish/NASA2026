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

/**
 * Exporta a PDF (jsPDF + autotable, carga diferida fuera del bundle inicial).
 * @param {object[]} filas - Filas de datos.
 * @param {string[]} columnas - Claves de columna.
 * @param {string} titulo - Título del documento.
 * @param {string} nombreArchivo - Nombre del archivo.
 * @returns {Promise<void>} Promesa.
 */
export async function exportarPdf(filas, columnas, titulo, nombreArchivo) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(titulo, 14, 16)
  doc.setFontSize(9)
  doc.text('Aviso de datos sensibles. Prototipo educativo, no un dispositivo médico.', 14, 22)
  autoTable(doc, {
    head: [columnas.map((c) => protegerCelda(c))],
    body: filas.map((f) => columnas.map((c) => protegerCelda(f[c]))),
    startY: 26,
  })
  doc.save(nombreArchivo)
}

/**
 * Exporta a Excel (exceljs, carga diferida fuera del bundle inicial).
 * @param {object[]} filas - Filas de datos.
 * @param {string[]} columnas - Claves de columna.
 * @param {string} nombreArchivo - Nombre del archivo.
 * @returns {Promise<void>} Promesa.
 */
export async function exportarExcel(filas, columnas, nombreArchivo) {
  const ExcelJS = await import('exceljs')
  const libro = new ExcelJS.Workbook()
  const hoja = libro.addWorksheet('Registros')
  hoja.columns = columnas.map((c) => ({ header: c, key: c, width: 24 }))
  for (const f of filas) {
    hoja.addRow(Object.fromEntries(columnas.map((c) => [c, protegerCelda(f[c])])))
  }
  const buffer = await libro.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}
