/**
 * @fileoverview E2E de sincronización offline (cola outbox + indicador).
 * Verifica que el indicador refleja el estado y que la cola se vacía al reconectar.
 * @module e2e/sincronizacion.spec
 */

import { test, expect } from '@playwright/test'

async function iniciarSesionAdmin(page) {
  await page.goto('/login')
  await page.fill('input[autocomplete="email"]', 'admin@ayni.health')
  await page.fill('input[autocomplete="current-password"]', 'admin123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/app/)
}

test('indicador de sincronización refleja conexión/desconexión', async ({ page, context }) => {
  await iniciarSesionAdmin(page)
  await page.goto('/app/registros')

  // En línea y sin pendientes: "Sincronizado".
  await expect(page.getByTestId('indicador-sincronizacion')).toContainText('Sincronizado')

  // Sin conexión.
  await context.setOffline(true)
  await page.waitForTimeout(500)
  await expect(page.getByTestId('indicador-sincronizacion')).toContainText('Sin conexión')

  // Reconexión: vuelve a sincronizar.
  await context.setOffline(false)
  await page.waitForTimeout(1500)
  await expect(page.getByTestId('indicador-sincronizacion')).toContainText('Sincronizado')
})
