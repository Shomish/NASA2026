# ADR-0009 · Estructura del shell y configuración

## Estado
Aceptado.

## Contexto
La aplicación autenticada necesita un layout (shell) con navegación y una sección de configuración (perfil, tema, umbrales clínicos, usuarios).

## Decisión
- **Shell** en `src/app/shell/`: layout con sidebar (escritorio, colapsable) + drawer y barra inferior de 5 destinos (móvil), topbar con reloj, selector de tripulante y acciones. El contenido se monta vía `<Outlet />` de react-router bajo `/app/*`.
- **Configuración** como vista propia (`VistaConfiguracion`) y, en el backend, endpoints `/api/v1/configuracion/*` protegidos por rol `administrador` (los umbrales clínicos son datos del servidor, no solo de la interfaz).
- Los **umbrales clínicos** viven en el servidor (en memoria hasta la Fase 10) y alimentan tanto la configuración como la lógica de escalamiento del chatbot, garantizando una única fuente de verdad.

## Consecuencias
- Cada módulo tendrá su ruta propia (`/app/...`) con carga diferida (code-splitting).
- La autorización por rol es efectiva en el servidor (middleware), no solo en el cliente.
