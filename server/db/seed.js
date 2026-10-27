/**
 * @fileoverview Siembra de datos iniciales (demo y datos de AYNI HEALTH).
 * @module server/db/seed
 */

import bcrypt from 'bcrypt'
import { config } from '../config.js'
import { modelos } from './modelos.js'

/**
 * Siembra los datos iniciales si la base está vacía.
 * @returns {Promise<void>} Promesa.
 */
export async function sembrar() {
  const { Usuario, Tripulante, Alimento, Contramedida, UmbralClinico, ConfiguracionIA } = modelos

  // Administrador demo (solo DEMO_MODE=true).
  if (config.DEMO_MODE === 'true') {
    const admin = await Usuario.findOne({ where: { email: 'admin@ayni.health' } })
    if (!admin) {
      await Usuario.create({
        nombre: 'Administrador',
        email: 'admin@ayni.health',
        password: await bcrypt.hash('admin123', 12),
        rol: 'administrador',
      })
    }
  }

  // Tripulantes actuales (existen sin cuenta vinculada).
  await Tripulante.findOrCreate({
    where: { nombre: 'Ana Quispe' },
    defaults: { cargo: 'Comandante', edad: 38, peso_kg: 62, altura_cm: 165, dia_mision: 120, mision: 'Misión Artemis', objetivo: 'Mantener densidad ósea y gestionar el estrés', alergias: ['lactosa'] },
  })
  await Tripulante.findOrCreate({
    where: { nombre: 'Diego Mamani' },
    defaults: { cargo: 'Ingeniero de Vuelo', edad: 41, peso_kg: 78, altura_cm: 178, dia_mision: 120, mision: 'Misión Artemis' },
  })
  await Tripulante.findOrCreate({
    where: { nombre: 'Lucía Condori' },
    defaults: { cargo: 'Oficial Médico', edad: 35, peso_kg: 58, altura_cm: 160, dia_mision: 120, mision: 'Misión Artemis' },
  })

  // Alimentos (superalimentos andinos y despensa).
  const alimentos = [
    { nombre: 'Maca', categoria: 'superalimento_andino', beneficio: 'Densidad ósea y resistencia', origen_andino: true },
    { nombre: 'Quinua', categoria: 'superalimento_andino', beneficio: 'Proteína completa muscular', origen_andino: true },
    { nombre: 'Muña', categoria: 'superalimento_andino', beneficio: 'Alivio digestivo', origen_andino: true },
    { nombre: 'Kiwicha', categoria: 'superalimento_andino', beneficio: 'Hierro para glóbulos rojos', origen_andino: true },
    { nombre: 'Tarwi', categoria: 'superalimento_andino', beneficio: 'Proteína vegetal', origen_andino: true },
    { nombre: 'Cañihua', categoria: 'superalimento_andino', beneficio: 'Proteína y fibra', origen_andino: true },
    { nombre: 'Chuño', categoria: 'superalimento_andino', beneficio: 'Energía de altura', origen_andino: true },
    { nombre: 'Mashua', categoria: 'superalimento_andino', beneficio: 'Nutriente andino', origen_andino: true },
    { nombre: 'Sacha Inchi', categoria: 'superalimento_andino', beneficio: 'Omega-3 antiinflamatorio', origen_andino: true },
    { nombre: 'Arroz fortificado', categoria: 'despensa', kcal: 210, proteina_g: 5, carbohidratos_g: 45, grasa_g: 1, origen_andino: false },
    { nombre: 'Verduras rehidratadas', categoria: 'despensa', kcal: 60, proteina_g: 3, carbohidratos_g: 12, grasa_g: 0, origen_andino: false },
  ]
  for (const a of alimentos) {
    const [alimento] = await Alimento.findOrCreate({ where: { nombre: a.nombre }, defaults: a })
    if (a.nombre === 'Maca') {
      await Contramedida.findOrCreate({ where: { alimento_id: alimento.id, objetivo: 'Densidad ósea y resistencia' }, defaults: { dosis_texto: '3 g/día', via: 'oral' } })
    }
    if (a.nombre === 'Quinua') {
      await Contramedida.findOrCreate({ where: { alimento_id: alimento.id, objetivo: 'Proteína completa muscular' }, defaults: { dosis_texto: '100-150 g/día', via: 'oral' } })
    }
    if (a.nombre === 'Muña') {
      await Contramedida.findOrCreate({ where: { alimento_id: alimento.id, objetivo: 'Alivio digestivo' }, defaults: { dosis_texto: 'Infusión 5 g ×2', via: 'infusión' } })
    }
  }

  // Umbrales clínicos iniciales.
  const umbrales = [
    { parametro: 'saturacion_oxigeno', min_normal: 95, max_normal: 100, min_critico: 90, max_critico: 100, unidad: '%' },
    { parametro: 'frecuencia_cardiaca', min_normal: 60, max_normal: 100, min_critico: 40, max_critico: 150, unidad: 'lpm' },
    { parametro: 'temperatura', min_normal: 36, max_normal: 37.5, min_critico: 34, max_critico: 40, unidad: '°C' },
    { parametro: 'phq9', min_normal: 0, max_normal: 9, min_critico: 20, max_critico: 27, unidad: 'puntos' },
  ]
  for (const u of umbrales) {
    await UmbralClinico.findOrCreate({ where: { parametro: u.parametro }, defaults: u })
  }

  // Configuración de IA (modo nube desactivado hasta consentimiento).
  await ConfiguracionIA.findOrCreate({
    where: { proveedor: 'gemini' },
    defaults: {
      proveedor: 'gemini',
      modelo: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
      activo: false,
      limite_diario_por_usuario: 50,
      limite_mensual_global: 10000,
      version_prompt_sistema: 'v1',
    },
  })
}
