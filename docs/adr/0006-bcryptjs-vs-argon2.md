# ADR-0006 · bcryptjs frente a argon2

## Estado
Aceptado.

## Contexto
Para el hash de contraseñas se evaluaron Argon2 (recomendación OWASP, ganador del PHC) y bcrypt.

- `argon2` y `bcrypt` son **módulos nativos** (requieren compilación con node-gyp / Visual Studio Build Tools).
- En este entorno Windows ya tuvimos un cuelgue de instalación con un módulo nativo (`better-sqlite3`), y la instalación de `argon2`/`bcrypt` nativos corre el mismo riesgo.
- `bcryptjs` es una implementación **pura en JavaScript** de bcrypt: sin compilación, se instala y ejecuta en cualquier entorno.

## Decisión
Usar **`bcryptjs`** con **coste mínimo 12** (y recomendado 12 para este prototipo). bcryptjs implementa bcrypt con `salt` de 16 bytes y factor de trabajo configurable.

## Consecuencias
- **Positivas:** instalación y despliegue sin fricción en Windows/CI; el hash de bcrypt es ampliamente compatible y auditable.
- **Negativas:** bcryptjs es más lento que bcrypt nativo (por ser JS puro), lo que es aceptable para el volumen de logins de este prototipo y, de hecho, ralentiza ligeramente la fuerza bruta.
- Si más adelante se requiere Argon2id, se aísla tras una interfaz `ServicioContrasenas` para poder migrar sin tocar los casos de uso.
