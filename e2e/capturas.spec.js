/**
 * @fileoverview Genera capturas del login y del shell en 360 y 1280 px (claro y oscuro).
 * Guarda en docs/capturas/.
 * @module e2e/capturas.spec
 */

import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const CARPETA = path.join('docs', 'capturas')
const VIEWPORTS = [
  { nombre: '360', ancho: 360, alto: 640 },
  { nombre: '1280', ancho: 1280, alto: 800 },
]
const TEMAS = ['oscuro', 'claro']

test('capturas de login y shell', async ({ browser }) => {
  fs.mkdirSync(CARPETA, { recursive: true })

  for (const vp of VIEWPORTS) {
    for (const tema of TEMAS) {
      const contexto = await browser.newContext({ viewport: { width: vp.ancho, height: vp.alto } })
      await contexto.addInitScript((t) => {
        localStorage.setItem('ayni-modo', t)
        localStorage.setItem('ayni-paleta', 'cusco')
      }, tema)
      const pagina = await contexto.newPage()

      // Captura del login.
      await pagina.goto('/login')
      await pagina.waitForTimeout(400)
      await pagina.screenshot({ path: path.join(CARPETA, `login-${tema}-${vp.nombre}.png`), fullPage: true })

      // Inicia sesión y captura el shell.
      await pagina.fill('input[autocomplete="username"]', 'admin')
      await pagina.fill('input[autocomplete="current-password"]', 'admin123')
      await pagina.click('button[type="submit"]')
      await expect(pagina).toHaveURL(/\/app/)
      await pagina.waitForTimeout(600)
      await pagina.screenshot({ path: path.join(CARPETA, `shell-${tema}-${vp.nombre}.png`), fullPage: true })

      await contexto.close()
    }
  }
})
