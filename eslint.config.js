/**
 * @fileoverview Configuración de ESLint (flat config, ESLint 9).
 * Reglas base + React + React Hooks + JSDoc, sin TypeScript (se añadirá en la migración gradual).
 * @module eslint.config
 */

import js from '@eslint/js'
import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import jsdocPlugin from 'eslint-plugin-jsdoc'

export default [
  { ignores: ['dist', 'node_modules', 'server/data'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      jsdoc: jsdocPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'jsdoc/require-jsdoc': 'off',
    },
  },
  {
    // Los logs de arranque del servidor son legítimos.
    files: ['server/**/*.js'],
    rules: { 'no-console': 'off' },
  },
]
