# ADR-0007 · Estrategia de sesión (JWT + refresh) y almacenamiento de tokens

## Estado
Aceptado.

## Contexto
La sesión debe ser segura para datos de salud (sensibles) y permitir acceso offline posterior (Fases 4-5).

## Decisión
- **Access token JWT de vida corta (~15 min)**, firmado con `JWT_SECRET` (HS256), sin datos personales sensibles en el payload (solo `sub` = id de usuario, `rol`).
- **Refresh token opaco, rotativo y revocable**, almacenado **hasheado (SHA-256)** en la base, entregado en cookie `httpOnly`, `Secure` y `SameSite=Strict`.
- Al refrescar: se valida el refresh, se **rota** (se revoca el anterior y se emite uno nuevo); si se detecta reutilización de un refresh ya usado, se revoca la sesión completa.
- El access token **no se guarda en localStorage**: vive solo en memoria del cliente (se obtiene vía `/me` con la cookie).

## Consecuencias
- Las rutas de datos (`/api/v1/*`) quedan protegidas por middleware JWT (401 sin sesión).
- La cookie httpOnly evita el robo de token por XSS; SameSite=Strict mitiga CSRF.
- Se requiere CSRF solo si se añaden rutas state-changing con cookie; el flujo de auth usa POST JSON + JWT en `Authorization`.

## Modo demo
Con `DEMO_MODE=true` se siembra el usuario `admin` / `admin123` con el hash de bcryptjs. En producción (`DEMO_MODE=false`) no existe ninguna credencial por defecto.
