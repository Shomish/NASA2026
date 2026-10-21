/**
 * @fileoverview E2E: navega por todas las rutas del shell tras iniciar sesión.
 * @module e2e/navegacion.spec
 */

import { test, expect } from '@playwright/test'

const RUTAS = [
  '/app',
  '/app/monitor',
  '/app/tripulacion',
  '/app/signos',
  '/app/salud-integral',
  '/app/nutricion',
  '/app/historial',
  '/app/diario',
  '/app/alertas',
  '/app/calendario',
  '/app/chat-ia',
  '/app/configuracion',
  '/app/ayuda',
]

test('navega por todas las rutas sin errores', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[autocomplete="username"]', 'admin')
  await page.fill('input[autocomplete="current-password"]', 'admin123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/app/)

  for (const ruta of RUTAS) {
    await page.goto(ruta)
    // El shell siempre muestra la marca AYNI HEALTH.
    await expect(page.getByText('AYNI HEALTH').first()).toBeVisible()
  }
})
