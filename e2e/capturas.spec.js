/**
 * @fileoverview Genera capturas de las pantallas clave en 360 y 1280 px (claro y oscuro).
 * Login, registro público, shell, tripulantes, registros y usuarios.
 * Guarda en docs/capturas/.
 * @module e2e/capturas.spec
 */

import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Las capturas (múltiples viewports × temas × pantallas) tardan más de 45 s.
test.setTimeout(180000)

const CARPETA = path.join('docs', 'capturas')
const VIEWPORTS = [
  { nombre: '360', ancho: 360, alto: 640 },
  { nombre: '1280', ancho: 1280, alto: 800 },
]
const TEMAS = ['oscuro', 'claro']

/**
 * Captura una pantalla nombrada.
 * @param {import('@playwright/test').Page} pagina - Página.
 * @param {string} nombre - Nombre base del archivo.
 * @param {string} tema - Tema.
 * @param {string} vp - Nombre del viewport.
 */
async function capturar(pagina, nombre, tema, vp, fullPage = true) {
  await pagina.screenshot({ path: path.join(CARPETA, `${nombre}-${tema}-${vp}.png`), fullPage })
}

test('capturas de login, registro y shell', async ({ browser }) => {
  fs.mkdirSync(CARPETA, { recursive: true })

  for (const vp of VIEWPORTS) {
    for (const tema of TEMAS) {
      const contexto = await browser.newContext({ viewport: { width: vp.ancho, height: vp.alto } })
      await contexto.addInitScript((t) => {
        localStorage.setItem('ayni-modo', t)
        localStorage.setItem('ayni-paleta', 'cusco')
      }, tema)
      const pagina = await contexto.newPage()

      // Captura de la landing.
      await pagina.goto('/')
      await pagina.waitForTimeout(800)
      await capturar(pagina, 'landing', tema, vp.nombre)

      // Captura del login.
      await pagina.goto('/login')
      await pagina.waitForTimeout(2500)
      await capturar(pagina, 'login', tema, vp.nombre)

      // Captura del registro público.
      await pagina.goto('/registro')
      await pagina.waitForTimeout(400)
      await capturar(pagina, 'registro', tema, vp.nombre)

      // Inicia sesión y captura el shell.
      await pagina.goto('/login')
      await pagina.fill('input[autocomplete="email"]', 'admin@ayni.health')
      await pagina.fill('input[autocomplete="current-password"]', 'admin123')
      await pagina.click('button[type="submit"]')
      await expect(pagina).toHaveURL(/\/app/)
      await pagina.waitForTimeout(600)
      await capturar(pagina, 'shell', tema, vp.nombre)

      await contexto.close()
    }
  }
})

test('capturas del núcleo 2A (tripulantes, registros, usuarios)', async ({ browser }) => {
  fs.mkdirSync(CARPETA, { recursive: true })

  for (const vp of VIEWPORTS) {
    for (const tema of TEMAS) {
      const contexto = await browser.newContext({ viewport: { width: vp.ancho, height: vp.alto } })
      await contexto.addInitScript((t) => {
        localStorage.setItem('ayni-modo', t)
        localStorage.setItem('ayni-paleta', 'cusco')
      }, tema)
      const pagina = await contexto.newPage()

      await pagina.goto('/login')
      await pagina.waitForTimeout(2500)
      await pagina.fill('input[autocomplete="email"]', 'admin@ayni.health')
      await pagina.fill('input[autocomplete="current-password"]', 'admin123')
      await pagina.click('button[type="submit"]')
      await expect(pagina).toHaveURL(/\/app/)

      for (const [ruta, nombre, fullPage] of [
        ['/app/tripulacion', 'tripulantes', true],
        ['/app/registros', 'registros', true],
        ['/app/usuarios', 'usuarios', true],
        ['/app/auditoria', 'auditoria', false],
        ['/app/cuerpo', 'cuerpo', true],
        ['/app/fundamento', 'fundamento', true],
      ]) {
        await pagina.goto(ruta)
        await pagina.waitForTimeout(800)
        await capturar(pagina, nombre, tema, vp.nombre, fullPage)
      }

      await contexto.close()
    }
  }
})
