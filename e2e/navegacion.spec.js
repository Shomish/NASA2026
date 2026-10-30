/**
 * @fileoverview E2E: navega por todas las rutas del shell tras iniciar sesión.
 * Verifica que ninguna ruta redirige a /login ni muestra el ErrorBoundary.
 * @module e2e/navegacion.spec
 */

import { test, expect } from '@playwright/test'

const RUTAS = [
  '/app',
  '/app/monitor',
  '/app/tripulacion',
  '/app/registros',
  '/app/usuarios',
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

test('navega por todas las rutas sin errores ni redirecciones', async ({ page }) => {
  await page.goto('/login')
  await page.waitForTimeout(2500)
  await page.fill('input[autocomplete="email"]', 'admin@ayni.health')
  await page.fill('input[autocomplete="current-password"]', 'admin123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/app/)

  for (const ruta of RUTAS) {
    await page.goto(ruta)
    await page.waitForTimeout(400)
    // No debe caer en el ErrorBoundary ni redirigir a /login.
    await expect(page.getByText('Algo salió mal')).toHaveCount(0)
    await expect(page).not.toHaveURL(/\/login/)
  }
})
