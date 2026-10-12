/**
 * @fileoverview Entidades y validación de dominio para el Monitor de Salud.
 * @module dominio/indice
 */

/**
 * Clase que representa a un astronauta (tripulante) monitorizado.
 */
export class Astronauta {
  /**
   * @param {object} parametros - Atributos.
   * @param {string} [parametros.id] - Identificador único.
   * @param {string} parametros.nombre - Nombre.
   * @param {string} parametros.rol - Rol en la tripulación.
   * @param {number} parametros.edad - Edad.
   * @param {'femenino' | 'masculino'} parametros.sexo - Sexo.
   * @param {number} parametros.pesoKg - Masa corporal.
   * @param {number} parametros.alturaCm - Estatura.
   * @param {number} parametros.diaMision - Día de misión.
   * @param {string} parametros.mision - Misión.
   * @param {string} parametros.destino - Destino.
   * @param {string[]} [parametros.condiciones] - Condiciones/riesgos de salud.
   * @param {string[]} [parametros.alergias] - Alergias.
   * @param {string} [parametros.objetivoSalud] - Objetivo principal de salud.
   */
  constructor({
    id,
    nombre,
    rol,
    edad,
    sexo,
    pesoKg,
    alturaCm,
    diaMision,
    mision,
    destino,
    condiciones = [],
    alergias = [],
    objetivoSalud = '',
  }) {
    this.id = id
    this.nombre = nombre
    this.rol = rol
    this.edad = edad
    this.sexo = sexo
    this.pesoKg = pesoKg
    this.alturaCm = alturaCm
    this.diaMision = diaMision
    this.mision = mision
    this.destino = destino
    this.condiciones = condiciones
    this.alergias = alergias
    this.objetivoSalud = objetivoSalud
  }

  /**
   * Índice de masa corporal.
   * @returns {number} IMC.
   */
  imc() {
    const alturaM = this.alturaCm / 100
    return Number((this.pesoKg / (alturaM * alturaM)).toFixed(1))
  }
}

/**
 * Rangos fisiológicos de referencia para validación de signos vitales.
 */
export const RANGOS_SIGNO_VITAL = {
  sistolica: { etiqueta: 'Presión sistólica', unidad: 'mmHg', normalMin: 90, normalMax: 120, criticoMin: 70, criticoMax: 180 },
  diastolica: { etiqueta: 'Presión diastólica', unidad: 'mmHg', normalMin: 60, normalMax: 80, criticoMin: 40, criticoMax: 120 },
  saturacion_oxigeno: { etiqueta: 'Saturación de O₂', unidad: '%', normalMin: 95, normalMax: 100, criticoMin: 85, criticoMax: 100 },
  masa_corporal: { etiqueta: 'Masa corporal', unidad: 'kg', normalMin: 50, normalMax: 90, criticoMin: 40, criticoMax: 110 },
  temperatura: { etiqueta: 'Temperatura', unidad: '°C', normalMin: 36, normalMax: 37.5, criticoMin: 34, criticoMax: 40 },
  frecuencia_cardiaca: { etiqueta: 'Frecuencia cardíaca', unidad: 'lpm', normalMin: 60, normalMax: 100, criticoMin: 40, criticoMax: 150 },
}

/**
 * Determina el estado de un valor vital.
 * @param {string} tipo - Tipo de signo.
 * @param {number} valor - Valor.
 * @returns {'optimo' | 'atencion' | 'critico'} Estado.
 */
export function evaluarSignoVital(tipo, valor) {
  const rango = RANGOS_SIGNO_VITAL[tipo]
  if (!rango || valor === null || valor === undefined || Number.isNaN(valor)) return 'optimo'
  if (valor < rango.criticoMin || valor > rango.criticoMax) return 'critico'
  if (valor < rango.normalMin || valor > rango.normalMax) return 'atencion'
  return 'optimo'
}

/**
 * Condiciones de salud conocidas y su relación con nutracéuticos.
 */
export const CATALOGO_CONDICIONES = [
  { id: 'perdida_osea', etiqueta: 'Pérdida ósea', recomendado: ['maca', 'quinua'] },
  { id: 'atrofia_muscular', etiqueta: 'Atrofia muscular', recomendado: ['quinua', 'kiwicha'] },
  { id: 'anemia', etiqueta: 'Anemia espacial', recomendado: ['kiwicha'] },
  { id: 'inflamacion', etiqueta: 'Inflamación', recomendado: ['sacha_inchi'] },
  { id: 'digestivo', etiqueta: 'Problemas digestivos', recomendado: ['muna'] },
  { id: 'estres', etiqueta: 'Estrés psicológico', recomendado: ['maca', 'muna'] },
  { id: 'hipoxia', etiqueta: 'Hipoxia / fatiga de altitud', recomendado: ['coca'] },
]
