/**
 * @fileoverview Importador de datos reales y de demostración (db:importar).
 * Lee un JSON con tripulación y registros, crea los tripulantes y registros,
 * genera alertas con los umbrales vigentes y reporta importados/descartados.
 * Modo dry-run: valida y cuenta sin escribir.
 * @module scripts/db-importar
 */

import fs from 'node:fs'
import { sequelize } from '../server/db/conexion.js'
import { modelos } from '../server/db/modelos.js'
import { generarCodigoUnico } from '../server/api/utilidades.js'
import { generarAlertas } from '../server/api/alertas.js'

const RUTA_JSON = process.argv[2]
const DRY_RUN = process.argv.includes('--dry-run') || process.env.npm_config_dry_run === 'true'

if (!RUTA_JSON) {
  console.error('Uso: npm run db:importar -- <ruta/al/archivo.json> [--dry-run]')
  process.exit(1)
}

const {
  Usuario,
  Tripulante,
  EntornoMision,
  Registro,
  SignoVital,
  RegistroSueno,
  RegistroGlucosa,
  EvaluacionPhq9,
} = modelos

/** Modelo de detalle por tipo de registro soportado por el importador. */
const MODELOS_DETALLE = {
  signos_vitales: SignoVital,
  sueno: RegistroSueno,
  glucosa: RegistroGlucosa,
  salud_mental: EvaluacionPhq9,
}

const resumen = {
  tripulantes: 0,
  registros: 0,
  descartados: 0,
  alertas: 0,
  duplicados: 0,
  tripulantesPorOrigen: {},
  registrosPorOrigen: {},
}

/**
 * Acumula un conteo por origen base (sin la fase, si existe).
 * @param {Record<string, number>} grupo - Grupo de conteo.
 * @param {string} origen - Origen completo.
 */
function contar(grupo, origen) {
  const base = String(origen ?? 'simulado').split('/')[0]
  grupo[base] = (grupo[base] ?? 0) + 1
}

try {
  const datos = JSON.parse(fs.readFileSync(RUTA_JSON, 'utf8'))
  const admin = await Usuario.findOne({ where: { rol: 'administrador' } })
  if (!admin) {
    throw new Error('No hay un usuario administrador. Ejecuta npm run db:setup primero.')
  }

  if (DRY_RUN) {
    console.log('(dry-run) Simulación de importación.')
  }

  /** Tripulantes planificados para validar el dry-run. */
  const planificados = new Map((datos.tripulacion ?? []).map((p) => [p.nombre, p]))

  for (const persona of datos.tripulacion ?? []) {
    if (!persona.nombre) {
      resumen.descartados += 1
      continue
    }
    const entorno = persona.entorno
      ? await EntornoMision.findOne({ where: { nombre: persona.entorno } })
      : null
    const origen = persona.origen ?? 'simulado'
    const valores = {
      nombre: persona.nombre,
      cargo: persona.cargo ?? persona.rol ?? null,
      edad: persona.edad ?? null,
      peso_kg: persona.peso_kg ?? persona.pesoKg ?? null,
      altura_cm: persona.altura_cm ?? persona.alturaCm ?? null,
      dia_mision: persona.dia_mision ?? persona.diaMision ?? null,
      mision: persona.mision ?? null,
      objetivo: persona.objetivo ?? persona.objetivoSalud ?? null,
      alergias: persona.alergias ?? null,
      origen,
      entorno_id: entorno?.id ?? persona.entorno_id ?? null,
    }

    if (!DRY_RUN) {
      const [tripulante] = await Tripulante.findOrCreate({ where: { nombre: valores.nombre }, defaults: valores })
      await tripulante.update(valores)
    }
    resumen.tripulantes += 1
    contar(resumen.tripulantesPorOrigen, origen)
  }

  const mapaTripulantes = new Map()
  if (!DRY_RUN) {
    for (const tripulante of await Tripulante.findAll()) {
      mapaTripulantes.set(tripulante.nombre, tripulante)
    }
  }

  for (const registro of datos.registros ?? []) {
    const modeloDetalle = MODELOS_DETALLE[registro.tipo]
    const tripulanteGuardado = mapaTripulantes.get(registro.tripulante)
    const tripulantePlan = planificados.get(registro.tripulante)
    const tripulante = tripulanteGuardado ?? (DRY_RUN ? tripulantePlan : null)
    if (!tripulante || !modeloDetalle || !registro.detalle) {
      resumen.descartados += 1
      continue
    }

    const origen = registro.origen ?? tripulante.origen ?? 'simulado'
    const fechaRegistro = registro.fecha_registro ? new Date(registro.fecha_registro) : new Date()
    if (!DRY_RUN) {
      const existe = await Registro.findOne({ where: { tripulante_id: tripulante.id, tipo: registro.tipo, fecha_registro: fechaRegistro, origen } })
      if (existe) {
        resumen.duplicados += 1
        continue
      }
      const creado = await Registro.create({
        codigo: await generarCodigoUnico(),
        usuario_id: admin.id,
        tripulante_id: tripulante.id,
        tipo: registro.tipo,
        estado: 'validado',
        fecha_registro: fechaRegistro,
        origen,
      })
      await modeloDetalle.create({ registro_id: creado.id, ...registro.detalle })
      resumen.alertas += await generarAlertas(creado, registro.detalle)
    }
    resumen.registros += 1
    contar(resumen.registrosPorOrigen, origen)
  }

  console.log(JSON.stringify(resumen, null, 2))
  if (DRY_RUN) console.log('(dry-run) No se escribió nada en la base.')
  await sequelize.close()
  process.exit(0)
} catch (error) {
  console.error(`❌ Error al importar: ${error.message}`)
  await sequelize.close().catch(() => {})
  process.exit(1)
}
