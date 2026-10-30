/**
 * @fileoverview Hook de sincronización offline (estado + cola outbox).
 * Reintenta las escrituras pendientes al reconectar.
 * @module features/gestion/useSincronizacion
 */

import { useCallback, useEffect, useState } from 'react'
import { operacionesPendientes, vaciarOutbox } from './outbox.js'

/**
 * Estado de sincronización offline.
 * @returns {{enLinea: boolean, pendientes: number, sincronizar: () => Promise<void>}} Estado.
 */
export function useSincronizacion() {
  const [enLinea, setEnLinea] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [pendientes, setPendientes] = useState(0)

  const actualizarPendientes = useCallback(async () => {
    const items = await operacionesPendientes()
    setPendientes(items.length)
  }, [])

  const sincronizar = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return
    await vaciarOutbox()
    await actualizarPendientes()
  }, [actualizarPendientes])

  useEffect(() => {
    actualizarPendientes()
    const alConectar = () => {
      setEnLinea(true)
      sincronizar()
    }
    const alDesconectar = () => setEnLinea(false)
    window.addEventListener('online', alConectar)
    window.addEventListener('offline', alDesconectar)
    return () => {
      window.removeEventListener('online', alConectar)
      window.removeEventListener('offline', alDesconectar)
    }
  }, [actualizarPendientes, sincronizar])

  return { enLinea, pendientes, sincronizar }
}
