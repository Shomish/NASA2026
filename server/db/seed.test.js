/**
 * @fileoverview Pruebas de la siembra: no se ejecuta en producción y no resetea
 * intentos_fallidos/bloqueado_hasta de usuarios existentes.
 * @module server/db/seed.test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { sequelize } from './conexion.js'
import { modelos } from './modelos.js'
import { sembrar } from './seed.js'

beforeAll(async () => {
  await sequelize.sync({ force: true })
})

afterAll(async () => {
  await sequelize.close()
})

describe('sembrar', () => {
  it('no resetea intentos_fallidos ni bloqueado_hasta de usuarios existentes', async () => {
    const usuario = await modelos.Usuario.create({
      nombre: 'Usuario Bloqueado',
      email: 'bloqueado@ayni.health',
      password: 'hash-prueba',
      rol: 'tripulante',
      intentos_fallidos: 4,
      bloqueado_hasta: new Date(Date.now() + 60_000),
    })

    await sembrar()

    const recargado = await modelos.Usuario.findByPk(usuario.id)
    expect(recargado.intentos_fallidos).toBe(4)
    expect(new Date(recargado.bloqueado_hasta).getTime()).toBeGreaterThan(Date.now())
  })

  it('no siembra datos en producción', async () => {
    await modelos.Usuario.destroy({ where: { email: 'admin@ayni.health' } })
    await sembrar('production')
    const admin = await modelos.Usuario.findOne({ where: { email: 'admin@ayni.health' } })
    expect(admin).toBeNull()
  })
})
