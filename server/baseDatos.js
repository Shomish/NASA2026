/**
 * @fileoverview Capa de base de datos SQLite (sql.js - WebAssembly).
 * Provee una base de datos relacional real sin compilación nativa.
 * @module server/baseDatos
 */

import initSqlJs from 'sql.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RUTA_ARCHIVO = path.join(__dirname, '..', 'data', 'salud_astronauta.db')

let SQL = null
let base = null

/**
 * Inicializa el motor SQLite y la base de datos.
 * @returns {Promise<object>} Instancia de la base de datos.
 */
export async function inicializarBaseDatos() {
  if (!SQL) {
    SQL = await initSqlJs()
  }

  // Crea el directorio de datos si no existe.
  const directorio = path.dirname(RUTA_ARCHIVO)
  if (!fs.existsSync(directorio)) {
    fs.mkdirSync(directorio, { recursive: true })
  }

  // Carga la base desde el archivo o crea una nueva.
  if (fs.existsSync(RUTA_ARCHIVO)) {
    base = new SQL.Database(fs.readFileSync(RUTA_ARCHIVO))
  } else {
    base = new SQL.Database()
  }

  crearEsquema()
  persistir()
  return base
}

/**
 * Crea las tablas si no existen.
 */
function crearEsquema() {
  base.run(`
    CREATE TABLE IF NOT EXISTS registros_salud (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instante TEXT NOT NULL,
      sistolica INTEGER,
      diastolica INTEGER,
      saturacion_oxigeno REAL,
      masa_corporal REAL,
      temperatura REAL,
      frecuencia_cardiaca INTEGER
    );
  `)

  base.run(`
    CREATE TABLE IF NOT EXISTS telemetria_iot (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dispositivo TEXT,
      metrica TEXT,
      valor REAL,
      unidad TEXT,
      instante TEXT NOT NULL
    );
  `)
}

/**
 * Persiste la base de datos en el archivo.
 */
export function persistir() {
  if (!base) return
  fs.writeFileSync(RUTA_ARCHIVO, Buffer.from(base.export()))
}

/**
 * Inserta un registro de signos vitales.
 * @param {object} registro - Registro de salud.
 * @returns {object} Registro insertado con su id.
 */
export function insertarRegistro(registro) {
  const instante = registro.instante ?? new Date().toISOString()
  base.run(
    `INSERT INTO registros_salud
      (instante, sistolica, diastolica, saturacion_oxigeno, masa_corporal, temperatura, frecuencia_cardiaca)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      instante,
      registro.sistolica ?? null,
      registro.diastolica ?? null,
      registro.saturacion_oxigeno ?? null,
      registro.masa_corporal ?? null,
      registro.temperatura ?? null,
      registro.frecuencia_cardiaca ?? null,
    ],
  )
  const resultado = base.exec('SELECT last_insert_rowid() AS id')
  const id = resultado[0].values[0][0]
  persistir()
  return { id, ...registro, instante }
}

/**
 * Obtiene todos los registros de salud.
 * @returns {object[]} Registros.
 */
export function obtenerRegistros() {
  const resultado = base.exec('SELECT * FROM registros_salud ORDER BY id DESC')
  if (resultado.length === 0) return []
  const columnas = resultado[0].columns
  return resultado[0].values.map((fila) => Object.fromEntries(columnas.map((c, i) => [c, fila[i]])))
}

/**
 * Inserta un dato de telemetría IoT.
 * @param {object} dato - Dato de telemetría.
 * @returns {object} Dato insertado.
 */
export function insertarTelemetria(dato) {
  const instante = dato.instante ?? new Date().toISOString()
  base.run(
    `INSERT INTO telemetria_iot (dispositivo, metrica, valor, unidad, instante)
      VALUES (?, ?, ?, ?, ?)`,
    [dato.dispositivo ?? 'iot', dato.metrica, dato.valor, dato.unidad ?? '', instante],
  )
  persistir()
  return { ...dato, instante }
}

/**
 * Obtiene la última telemetría IoT.
 * @returns {object[]} Datos de telemetría.
 */
export function obtenerTelemetria() {
  const resultado = base.exec('SELECT * FROM telemetria_iot ORDER BY id DESC LIMIT 50')
  if (resultado.length === 0) return []
  const columnas = resultado[0].columns
  return resultado[0].values.map((fila) => Object.fromEntries(columnas.map((c, i) => [c, fila[i]])))
}

/**
 * Devuelve la instancia de la base (para consultas directas).
 * @returns {object} Instancia SQLite.
 */
export function obtenerBase() {
  return base
}
