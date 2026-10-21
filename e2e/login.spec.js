/**
 * @fileoverview Pruebas E2E del login (Playwright).
 * @module e2e/login.spec
 */

import { test, expect } from '@playwright/test'

test('login correcto redirige a /app', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[autocomplete="username"]', 'admin')
  await page.fill('input[autocomplete="current-password"]', 'admin123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/app/)
})

test('ruta privada sin sesión redirige a /login', async ({ page }) => {
  await page.goto('/app')
  await expect(page).toHaveURL(/\/login/)
})

test('login con credenciales incorrectas muestra error', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[autocomplete="username"]', 'admin')
  await page.fill('input[autocomplete="current-password"]', 'incorrecta')
  await page.click('button[type="submit"]')
  await expect(page.getByRole('alert')).toBeVisible()
})
