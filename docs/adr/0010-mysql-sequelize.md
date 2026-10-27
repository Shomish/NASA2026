# ADR-0010 · Motor de datos: MySQL + Sequelize (reemplaza lo previsto para la Fase 10)

## Estado
Aceptado.

## Contexto
La entrega académica exige Node.js + Express, Sequelize, MySQL, bcrypt, crypto y CRUD relacional. Originalmente la base relacional estaba prevista para la Fase 10 (PostgreSQL + Prisma).

## Decisión
Se **reemplaza** PostgreSQL/Prisma por **MySQL + Sequelize (driver mysql2)**. El motor de datos pasa de `sql.js` (en memoria) a MySQL en `127.0.0.1:3313`.

## Consecuencias
- **Positivas:** cumple la rúbrica del curso; modelo relacional normalizado con claves foráneas e índices; migraciones versionadas.
- **Negativas:** requiere MySQL corriendo (Workbench). La capa de repositorios oculta Sequelize a los servicios, de modo que un futuro cambio de motor no toca la lógica.
- El resto de la Fase 10 (offline-first, sincronización con `idempotency_key`, importación de datos, auditoría) se mantiene y se adelanta en lo necesario.
- **ADR-0008 queda OBSOLETO**: los usuarios y sesiones ya no están en memoria; ahora viven en `usuarios` y `sesiones_refresh`.
