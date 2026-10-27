/**
 * @fileoverview E2E funcional del núcleo 2A (Pixel 7 e iPhone 14).
 * Registro público → login admin → crear tripulante → crear registro → validar
 * → cerrar → borrar → recargar para verificar persistencia.
 * @module e2e/nucleo.spec
 */

import { test, expect } from '@playwright/test'

const sufijo = Date.now().toString(36)
const NOMBRE_TRIPULANTE = `Tripulante E2E ${sufijo}`
const EMAIL_REGISTRO = `e2e-${sufijo}@ayni.health`

async function iniciarSesionAdmin(page) {
  await page.goto('/login')
  await page.fill('input[autocomplete="email"]', 'admin@ayni.health')
  await page.fill('input[autocomplete="current-password"]', 'admin123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/app/)
}

test('flujo completo: registrar → login → tripulante → registro → validar → cerrar → borrar → persistencia', async ({ page }) => {
  // 1. Registro público (crea rol tripulante).
  await page.goto('/login')
  await page.getByRole('link', { name: 'Crear una cuenta' }).click()
  await expect(page).toHaveURL(/\/registro/)
  await page.fill('#reg-nombre', 'Tripulante Registrado')
  await page.fill('#reg-email', EMAIL_REGISTRO)
  await page.fill('#reg-contrasena', 'clave1234')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page).toHaveURL(/\/login/)

  // 2. Inicia sesión como administrador (crear/validar/cerrar exigen admin).
  await iniciarSesionAdmin(page)

  // 3. Crea un tripulante.
  await page.goto('/app/tripulacion')
  await page.getByTestId('nuevo-tripulante').click()
  await page.fill('#tp-nombre', NOMBRE_TRIPULANTE)
  await page.fill('#tp-cargo', 'Especialista')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText(NOMBRE_TRIPULANTE).first()).toBeVisible()

  // 4. Crea un registro de signos vitales para ese tripulante.
  await page.goto('/app/registros')
  await page.getByTestId('nuevo-registro').click()
  await page.selectOption('#r-tripulante', { label: NOMBRE_TRIPULANTE })
  await page.fill('#r-frecuencia_cardiaca', '72')
  await page.fill('#r-spo2', '97')
  await page.getByRole('button', { name: 'Crear' }).click()

  // Muestra el código y el estado pendiente.
  const codigo = (await page.getByTestId('ultimo-codigo').textContent())?.trim()
  expect(codigo).toMatch(/^[0-9A-F]{8}$/)

  // 5. Valida (admin).
  await page.locator('div.rounded-tarjeta').filter({ hasText: codigo }).getByRole('button', { name: 'Validar' }).click()
  await expect(page.locator('div.rounded-tarjeta').filter({ hasText: codigo }).getByText('Validado')).toBeVisible()

  // 6. Cierra (admin).
  await page.locator('div.rounded-tarjeta').filter({ hasText: codigo }).getByRole('button', { name: 'Cerrar' }).click()
  await expect(page.locator('div.rounded-tarjeta').filter({ hasText: codigo }).getByText('Cerrado')).toBeVisible()

  // 7. Borra con confirmación.
  await page.locator('div.rounded-tarjeta').filter({ hasText: codigo }).getByRole('button', { name: 'Eliminar' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()

  // 8. Recarga y verifica persistencia (el registro ya no está en la lista).
  await page.goto('/app/registros')
  await expect(page.getByText(codigo)).toHaveCount(0)

  // El tripulante y el usuario persisten también tras recargar.
  await page.goto('/app/tripulacion')
  await expect(page.getByText(NOMBRE_TRIPULANTE).first()).toBeVisible()
})
