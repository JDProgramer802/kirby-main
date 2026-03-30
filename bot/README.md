# Bot de WhatsApp (Baileys + PostgreSQL)

Bot modular para grupos con economía, gacha, NSFW opcional, sub-bots, panel web API y despliegue en Supabase.

## Requisitos

- Node.js **18+**
- Cuenta **PostgreSQL** (recomendado: [Supabase](https://supabase.com)) y cadena `DATABASE_URL`
- WhatsApp en el teléfono que vincularás por QR

## Instalación

```bash
cd bot
npm install
```

## Configuración `.env`

Variables habituales:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL (Supabase). SSL con `rejectUnauthorized: false` en el pool. |
| `BOT_PREFIX` | Prefijo de comandos (por defecto `/`). |
| `BOT_NAME` | Nombre mostrado. |
| `BOT_OWNER` | Números dueño separados por coma (`521...,573...`). |
| `SESSION_DIR` | Carpeta de credenciales Baileys (ej. `./sessions/main`). |
| `SUBBOTS` | JSON opcional de instancias múltiples. |
| `GITHUB_TOKEN` / `GITHUB_REPO` | Opcional: subir banners a GitHub. |
| `JWT_SECRET` | Secreto para JWT del panel (`npm run web`). |
| `WEB_PORT` | Puerto del panel API (por defecto `3000`). |

Ejecuta comprobaciones y migraciones:

```bash
npm run setup
```

## Primera sesión (QR)

1. Configura `.env` con al menos `DATABASE_URL` y `BOT_OWNER`.
2. `npm run setup` luego `npm start`.
3. Escanea el QR en la consola con WhatsApp → Dis positivos vinculados.

## GitHub Actions

El workflow `.github/workflows/bot.yml` asume que el código del bot está en la carpeta **`bot/`** en la raíz del repo.

**Secrets obligatorios:** `DATABASE_URL`, `BOT_OWNER`.

**Opcionales:** `BOT_PREFIX`, `BOT_NAME`, `SESSION_DIR`, `JWT_SECRET`, `WEB_PORT`, `LOG_LEVEL`, `SUBBOTS` (JSON en una línea), `GITHUB_TOKEN_UPLOAD`, `GITHUB_REPO`, `GITHUB_BRANCH`.

En **Settings → Actions → General → Workflow permissions** elige **Read and write** para poder subir el artifact de sesión.

Si tu repo tiene el contenido de `bot/` **directamente en la raíz** (sin carpeta `bot/`), edita el workflow: `working-directory: .`, rutas `sessions/main` y `cache-dependency-path: package-lock.json`.

### Código 515 en los logs (`Stream Errored (restart required)`)

En Baileys, **515** es `restartRequired`: el servidor de WhatsApp pide cerrar y volver a abrir el socket. Suele **ser normal** justo después de escanear el QR o cuando hay actualización de protocolo; el bot **reconecta solo**.

Si en **GitHub Actions** ves **515 una y otra vez** y la sesión no se estabiliza, las IPs de **datacenter** (GitHub, Azure, etc.) a menudo dan problemas con WhatsApp. Opciones:

- Emparejar el bot **en tu PC** (`npm start`), dejar que guarde sesión, y luego **subir el artifact** o copiar `sessions/main` al flujo que uses.
- Usar un **VPS**, **Railway**, **Render**, runner **self-hosted**, u otro servidor con IP residencial o estable.

El job **no** “termina” en unos minutos: queda **hasta ~6 h** (o el `timeout-minutes` del workflow) ejecutando el bot; eso es esperado, no un “atasco”.

## Panel web (configuración)

1. `npm run web` (o despliegue con `WEB_PORT` y `JWT_SECRET`).
2. Login: usuario creado por `npm run setup` (`admin` / `admin` la primera vez).
3. **Configuración**: edita variables del bot y GitHub; se guardan en `panel_config`. Exporta `.env` de referencia para copiar a **GitHub Secrets**.
4. Reinicia el proceso del bot para aplicar cambios (el pool de DB sigue usando el `DATABASE_URL` inicial hasta reinicio).

## Añadir comandos

1. Crea `commands/<categoría>/<nombre>.js` exportando `default` con `name`, `description`, `category`, `usage`, `execute`, y opcionales `aliases`, `cooldown`, `adminOnly`, `groupOnly`, `nsfw`.
2. Recarga sin reiniciar: comando de dueño `/reload` o `POST /api/commands/reload` (panel, con JWT).

## Estructura

- `core/` — `handler.js`, `loader.js`, `subbot.js`
- `commands/` — comandos por carpetas
- `database/` — `db.js`, `migrations.js` (esquema panel + ENUMs Supabase)
- `web/` — API Express y `panel/` (HTML estático)
- `utils/` — helpers (permisos, menú, booru, etc.)

## Panel web

```bash
npm run web
```

- API: `http://127.0.0.1:3000/api/...`
- Estáticos: `web/panel/`
- Login: `POST /api/auth/login` (tabla `web_users`). Crea un usuario con hash bcrypt o amplía `npm run setup` para seed.

## Base de datos

- El bot usa tablas legado (`group_settings`, `gacha_*`, `economy_members`, …) creadas en `ensureTables()`.
- `migrations.js` añade tablas normalizadas (`bots`, `groups`, `users`, …) para evolución del panel **sin borrar** las tablas del bot. Los packs del panel se llaman `web_sticker_packs` para no chocar con `sticker_packs` del bot.

## Notas

- Los comandos NSFW requieren `nsfw_enabled` en el grupo y `category: 'NSFW'` + `nsfw: true`.
- Descargas (`youtube`, `tiktok`, `instagram`, `twitter`) dependen de servicios de terceros; pueden fallar sin aviso.
- No se usa `mysql2`; todo es PostgreSQL vía `pg`.
