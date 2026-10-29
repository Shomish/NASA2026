/**
 * @fileoverview E2E del contexto de tripulante (saber siempre a quién se registra).
 * El administrador cambia a Diego, registra una medición, queda en Diego y persiste
 * tras F5. Se ejecuta en móvil y escritorio.
 * @module e2e/contexto.spec
 */

import { test, expect } from '@playwright/test'

async function iniciarSesionAdmin(page) {
  await page.goto('/login')
  await page.fill('input[autocomplete="email"]', 'admin@ayni.health')
  await page.fill('input[autocomplete="current-password"]', 'admin123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/app/)
}

test('contexto de tripulante: cambiar a Diego, registrar y persistir', async ({ page }) => {
  await iniciarSesionAdmin(page)
  await page.goto('/app/registros')

  // Cambia el tripulante activo a Diego Mamani.
  await page.getByRole('button', { name: 'Cambiar tripulante' }).click()
  await page.locator('[role="dialog"]').getByText('Diego Mamani').click()

  // La barra de contexto muestra a Diego.
  await expect(page.getByTestId('contexto-nombre')).toHaveText('Diego Mamani')

  // Crea un registro: el formulario debe quedar prefijado en Diego.
  await page.getByTestId('nuevo-registro').click()
  await expect(page.locator('#r-tripulante')).toHaveValue(/./)
  await page.fill('#r-frecuencia_cardiaca', '70')
  await page.getByRole('button', { name: /Guardar para/ }).click()

  // El toast menciona a Diego.
  await expect(page.getByText(/Medición guardada para Diego/)).toBeVisible()

  // F5: el tripulante activo persiste.
  await page.reload()
  await expect(page).toHaveURL(/\/app\/registros/)
  await expect(page.getByTestId('contexto-nombre')).toHaveText('Diego Mamani')
})

test('contexto de tripulante: fijo y sin selector para un tripulante', async ({ page }) => {
  // Registra un tripulante y entra con su cuenta (ve solo su perfil).
  const sufijo = Date.now().toString(36)
  const email = `trip-${sufijo}@ayni.health`
  await page.goto('/registro')
  await page.fill('#reg-nombre', 'Tripulante Fijo')
  await page.fill('#reg-email', email)
  await page.fill('#reg-contrasena', 'clave1234')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.waitForTimeout(500)

  await page.fill('#email', email)
  await page.fill('#contrasena', 'clave1234')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/app/)

  await page.goto('/app/registros')
  // Un tripulante sin perfil vinculado ve el aviso (no tiene selector ni barra con "Cambiar").
  await expect(page.getByText(/No tienes un perfil de tripulante vinculado/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cambiar tripulante' })).toHaveCount(0)
})

test('la selección de tripulante no se hereda entre usuarios', async ({ browser }) => {
  const contexto = await browser.newContext({ viewport: { width: 1280, height: 800 }, baseURL: 'http://localhost:5173' })
  const page = await contexto.newPage()

  // Admin: login y seleccionar Diego.
  await page.goto('/login')
  await page.fill('input[autocomplete="email"]', 'admin@ayni.health')
  await page.fill('input[autocomplete="current-password"]', 'admin123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/app/)
  await page.goto('/app/registros')
  await page.getByRole('button', { name: 'Cambiar tripulante' }).click()
  await page.locator('[role="dialog"]').getByText('Diego Mamani').click()
  await expect(page.getByTestId('contexto-nombre')).toHaveText('Diego Mamani')

  // Cierra sesión.
  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page).toHaveURL(/\/login/)

  // Otra persona: registra y entra.
  const sufijo = Date.now().toString(36)
  const email = `otro-${sufijo}@ayni.health`
  await page.goto('/registro')
  await page.fill('#reg-nombre', 'Otra Persona')
  await page.fill('#reg-email', email)
  await page.fill('#reg-contrasena', 'clave1234')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.waitForTimeout(500)
  await page.fill('#email', email)
  await page.fill('#contrasena', 'clave1234')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/app/)

  // No hereda la selección de Diego.
  await page.goto('/app/registros')
  await expect(page.getByTestId('contexto-nombre')).toHaveCount(0)

  await contexto.close()
})
