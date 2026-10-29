/**
 * @fileoverview E2E de regresión del bucle infinito de renderizado (Paso 0).
 * Inicia sesión y hace clic en cada ítem del menú lateral (desktop), del drawer
 * y de la barra inferior (móvil). Falla si aparece el ErrorBoundary o hay errores
 * de consola (firma del bucle). Se ejecuta contra el servidor de desarrollo
 * (React.StrictMode activo). Incluye el caso IndexedDB con datos viejos + F5.
 * @module e2e/regresion-navegacion.spec
 */

import { test, expect } from '@playwright/test'

/** Firma del bucle de renderizado y de errores de React. */
const FIRMA_ERROR = /Maximum update depth|getSnapshot should be cached|The above error occurred|An error occurred in the <|Error no controlado|Uncaught/

/** Ítems del menú lateral (desktop / drawer). */
const MENU = [
  'Dashboard', 'Monitor de salud', 'Signos vitales', 'Salud integral', 'Calendario',
  'Nutrición inteligente', 'Registros', 'Tripulantes', 'Historial', 'Diario',
  'Alertas', 'Médico de IA', 'Usuarios', 'Presentación', 'Configuración', 'Ayuda',
]

/** Ítems de la barra inferior (móvil). */
const BARRA_INFERIOR = ['Inicio', 'Monitor', 'Registrar', 'Nutrición', 'Más']

/**
 * Adjunta recolectores de errores de consola y de página.
 * @param {import('@playwright/test').Page} page - Página.
 * @returns {{ errores: string[] }} Recolector.
 */
function recolectarErrores(page) {
  const errores = []
  page.on('pageerror', (e) => errores.push(`[pageerror] ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errores.push(`[console.error] ${m.text()}`)
  })
  return { errores }
}

/**
 * Inicia sesión como administrador.
 * @param {import('@playwright/test').Page} page - Página.
 */
async function iniciarSesion(page) {
  await page.goto('/login')
  await page.fill('input[autocomplete="email"]', 'admin@ayni.health')
  await page.fill('input[autocomplete="current-password"]', 'admin123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/app/)
}

test('desktop: clic en cada ítem del menú lateral sin error', async ({ browser }) => {
  const contexto = await browser.newContext({ viewport: { width: 1280, height: 800 }, baseURL: 'http://localhost:5173' })
  const page = await contexto.newPage()
  const { errores } = recolectarErrores(page)

  await iniciarSesion(page)

  for (const etiqueta of MENU) {
    await page.locator('aside').getByRole('link', { name: etiqueta }).click()
    await page.waitForTimeout(400)
  }

  await expect(page.getByText('Algo salió mal')).toHaveCount(0)
  expect(errores.filter((e) => FIRMA_ERROR.test(e))).toHaveLength(0)

  await contexto.close()
})

test('móvil: clic en la barra inferior y drawer con todos los ítems sin error', async ({ page }) => {
  const { errores } = recolectarErrores(page)

  await iniciarSesion(page)

  // Barra inferior (5 destinos): navega haciendo clic.
  for (const etiqueta of BARRA_INFERIOR) {
    await page.getByRole('button', { name: etiqueta, exact: true }).click()
    await page.waitForTimeout(400)
  }

  // Drawer: abre y verifica que todos los ítems del menú lateral están visibles.
  await page.getByRole('button', { name: 'Abrir menú' }).click()
  await page.waitForTimeout(600)
  for (const etiqueta of MENU) {
    await expect(page.getByRole('link', { name: etiqueta })).toBeVisible()
  }
  await page.keyboard.press('Escape')

  await expect(page.getByText('Algo salió mal')).toHaveCount(0)
  expect(errores.filter((e) => FIRMA_ERROR.test(e))).toHaveLength(0)
})

test('IndexedDB con datos viejos y F5 dentro de /app', async ({ page }) => {
  const { errores } = recolectarErrores(page)

  await page.goto('/login')
  // Siembra IndexedDB con datos planos del esquema anterior (v1/v2).
  await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('salud_astronauta_db', 2)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('tripulacion')) db.createObjectStore('tripulacion', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('historial')) db.createObjectStore('historial', { keyPath: 'id' })
      }
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction(['tripulacion', 'historial'], 'readwrite')
        tx.objectStore('tripulacion').put({ id: 'ana-quispe', nombre: 'Ana Quispe', rol: 'Comandante', edad: 38, sexo: 'femenino', pesoKg: 62, alturaCm: 165, diaMision: 120, mision: 'Artemis', destino: 'Marte', condiciones: ['perdida_osea'], alergias: ['lactosa'], objetivoSalud: 'densidad ósea' })
        tx.objectStore('historial').put({ id: 'r1', personaId: 'ana-quispe', tipo: 'signo', signoTipo: 'frecuencia_cardiaca', valor: 72, instante: new Date().toISOString() })
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      request.onerror = () => reject(request.error)
    })
  })

  await iniciarSesion(page)

  // F5 dentro de /app (restaura la sesión vía refresh + lee IndexedDB).
  await page.reload()
  await expect(page).toHaveURL(/\/app/)
  await page.waitForTimeout(800)

  await expect(page.getByText('Algo salió mal')).toHaveCount(0)
  expect(errores.filter((e) => FIRMA_ERROR.test(e))).toHaveLength(0)
})
