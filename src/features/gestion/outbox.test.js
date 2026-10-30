/**
 * @fileoverview Pruebas de la cola outbox (IndexedDB) y su vaciado idempotente.
 * @module features/gestion/outbox.test
 */

// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { encolar, operacionesPendientes, limpiarOutbox } from './outbox.js'
import * as api from './api.js'

describe('outbox (IndexedDB)', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    await limpiarOutbox()
  })

  it('encola una operación y la lista como pendiente', async () => {
    const entrada = await encolar('crear_registro', { tripulante_id: 1, tipo: 'signos_vitales', detalle: {} })
    const pendientes = await operacionesPendientes()
    expect(pendientes).toHaveLength(1)
    expect(pendientes[0].id).toBe(entrada.id)
    expect(pendientes[0].operacion).toBe('crear_registro')
  })

  it('vacía la cola llamando a /sync con la idempotency_key', async () => {
    const espia = vi.spyOn(api, 'sincronizar').mockResolvedValue({ duplicado: false })
    const entrada = await encolar('crear_registro', { tripulante_id: 1, tipo: 'signos_vitales', detalle: {} })

    const { vaciarOutbox } = await import('./outbox.js')
    const resultado = await vaciarOutbox()

    expect(resultado.exitosas).toBe(1)
    expect(espia).toHaveBeenCalledWith({ idempotency_key: entrada.id, operacion: 'crear_registro', datos: { tripulante_id: 1, tipo: 'signos_vitales', detalle: {} } })
    expect(await operacionesPendientes()).toHaveLength(0)
  })
})
