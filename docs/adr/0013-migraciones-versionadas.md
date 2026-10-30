# ADR-0013 · Migraciones versionadas (ALTER TABLE idempotentes)

## Estado
Aceptado.

## Contexto
`sequelize.sync()` crea tablas nuevas pero **no** altera columnas ni ENUMs de tablas existentes. Los cambios del reto (nuevos tipos de `registros.tipo`, `entorno_id` en `tripulantes`, columnas nullable) requerían ALTER TABLE, y un fallo en la siembra dejaba el servidor caído en desarrollo.

## Decisión
- Tabla `migraciones` (nombre, `fecha_aplicacion`) que registra qué migraciones ya se aplicaron.
- Cada ALTER es una **migración numerada e idempotente** (`001_entorno_id_tripulantes`, `002_tipos_registro`, `003_tripulante_id_nullable`).
- Se ejecutan con `npm run db:migrate` (y desde `db:setup`). El servidor **NO** aplica ALTER TABLE al arrancar en `NODE_ENV=production` (solo en desarrollo para comodidad local).

## Consecuencias
- **Positivas:** el esquema se versiona de forma reproducible; en producción se aplican explícitamente antes del despliegue.
- **Negativas:** `sync()` sigue creando tablas nuevas; en producción se recomienda migrar por completo a sequelize-cli (las migraciones ligeras cubren solo los ALTER actuales).
