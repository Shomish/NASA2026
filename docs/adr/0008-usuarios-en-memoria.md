# ADR-0008 · Usuarios y sesiones en memoria hasta la Fase 10

## Estado
Aceptado.

## Contexto
La autenticación necesita almacenar usuarios (con hash de contraseña) y refresh tokens (hasheados, revocables). La Fase 10 migra a PostgreSQL.

## Decisión
El repositorio de usuarios y refresh tokens usa **almacenamiento en memoria** (un `Map`), sembrado en el arranque con el usuario de demostración cuando `DEMO_MODE=true`.

## Consecuencias
- **Positivas:** sin dependencia de un motor de base de datos; la interfaz del repositorio (`encontrarPorUsername`, `buscarPorId`, `guardarRefreshToken`, `estadoRefresh`, `revocar*`) es estable, de modo que la Fase 10 solo sustituye la implementación interna (PostgreSQL) sin tocar el servicio ni los controladores.
- **Negativas:** los usuarios y sesiones se pierden al reiniciar el servidor. Aceptable para el prototipo; se documenta que la persistencia real llega con PostgreSQL.
