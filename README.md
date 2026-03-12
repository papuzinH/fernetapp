# FernetApp

**Progressive Web App** para la gestión y estadísticas del equipo de fútbol amateur **Club Atlético Fernet con Guaymallén**.

## Tech Stack

- **Framework**: Next.js 16 (App Router, RSC)
- **Base de datos**: Supabase (PostgreSQL + Auth)
- **UI**: shadcn/ui + Tailwind CSS 4
- **PWA**: Service Worker + Web Push (VAPID)
- **Social**: Instagram Graph API widget

## Requisitos

- Node.js 18+
- Cuenta de Supabase

## Instalación

```bash
npm install
cp .env.example .env.local  # Crear y configurar variables de entorno
npm run dev
```

## Variables de Entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Clave anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo seed | Service role key para script de seed |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Para push | Clave pública VAPID |
| `VAPID_PRIVATE_KEY` | Para push | Clave privada VAPID |
| `VAPID_EMAIL` | Para push | Email de contacto VAPID |
| `INSTAGRAM_ACCESS_TOKEN` | Para Instagram | Token de acceso Instagram Graph API |
| `INSTAGRAM_USER_ID` | Para Instagram | ID de usuario de Instagram (default: `"me"`) |
| `NEXT_PUBLIC_SITE_URL` | Para push auto | URL del sitio en producción |

## Base de Datos

Ejecutar las migraciones en orden dentro de Supabase SQL Editor:

1. `supabase/migrations/001_initial_schema.sql` — Tablas base (players, tournaments, matches, stats) + views
2. `supabase/migrations/002_phase2_schema.sql` — Payments, MVP votes, push subscriptions, campos fase 2
3. `supabase/migrations/003_fix_scheduled_and_mvp.sql` — Fix: vistas filtran solo partidos completed, MVP sin empate

---

## Guía: Configurar Push Notifications (VAPID)

Las notificaciones push requieren claves VAPID. Estas se usan para identificar al servidor de push como autorizado.

### Paso 1: Generar claves VAPID

```bash
npx web-push generate-vapid-keys
```

Esto producirá algo como:

```
=======================================
Public Key:
BAyd8FfnC...largo...

Private Key:
4k2Ts6x...largo...
=======================================
```

### Paso 2: Configurar variables de entorno

En tu archivo `.env.local` (o en el panel de tu hosting):

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BAyd8FfnC...tu_clave_publica...
VAPID_PRIVATE_KEY=4k2Ts6x...tu_clave_privada...
VAPID_EMAIL=mailto:tu@email.com
```

### Paso 3: HTTPS obligatorio

Las Push Notifications y los Service Workers **solo funcionan en HTTPS** (excepto `localhost` para desarrollo). Asegurate de que tu sitio en producción use HTTPS.

### Paso 4: Verificar

1. Abrí tu app en el navegador.
2. Hacé clic en el ícono de campana 🔔 en la navbar.
3. Aceptá el permiso de notificaciones.
4. Creá un partido programado desde Admin → el push debería llegar automáticamente.

### Troubleshooting

- **No aparece el botón de notificaciones**: Verificá que el navegador soporte la Push API y Service Workers (Chrome, Firefox, Edge). Safari tiene soporte limitado.
- **Las notificaciones no llegan**: Verificá que las 3 variables VAPID estén configuradas. Revisá la consola del servidor por errores en `/api/push/send`.
- **Error "VAPID keys no configuradas"**: Las variables de entorno no están disponibles en el servidor. Reiniciá la app después de configurarlas.

---

## Guía: Configurar Widget de Instagram

El widget muestra el último post de la cuenta de Instagram del equipo.

### Paso 1: Crear una Facebook App

1. Andá a [developers.facebook.com](https://developers.facebook.com).
2. Creá una nueva app (tipo: "Consumer" o "Business").
3. Agregá el producto **"Instagram Graph API"**.

### Paso 2: Vincular cuenta de Instagram

- Tu cuenta de Instagram debe ser una **cuenta profesional** (Business o Creator).
- Vinculá tu cuenta de Instagram a una **Facebook Page**.
- En la configuración de la Facebook App, agregá la Facebook Page vinculada.

### Paso 3: Obtener token de acceso

1. Andá al [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Seleccioná tu app.
3. Generá un **User Token** con los permisos:
   - `instagram_basic`
   - `pages_show_list`
   - `pages_read_engagement`
4. Obtendrás un **token de corta duración** (1 hora).

### Paso 4: Convertir a token de larga duración (60 días)

**En Bash/Git Bash:**
```bash
curl -i -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}"
```

**En PowerShell:**
```powershell
$appId = "4285867254893280"
$appSecret = "b2a6475e067ce45fe7530a0c17254e53"
$shortToken = "EAA85ZBTtISuABQ79ZA0u3qO45zmUaFXGQKziCX2quvZBAoJjnX6UfMCeEhiPoCkmmfkiuUfp6vowHrwgCSATM2568oO6e9HMk8SCGlUwXPNGNX5LkUlPZAG5x47lUgd9jSHTwIDa6ZCzEjKFXbUFgpeGZAVNVgtuPgRcEWf9FxgK5JSaFIVLl5taIunRK5jBGsdk4RhZAO2VdHuKOEIqhtbewXdMkxsvkdlU3c5HiJhJLqueXyGvQZDZD"
$url = "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=$appId&client_secret=$appSecret&fb_exchange_token=$shortToken"
Invoke-RestMethod -Uri $url
```

El token resultante dura **60 días**.

### Paso 5: Obtener tu Instagram Business Account ID

**⚠️ Importante**: El token de Facebook no funciona directamente con Instagram. Necesitás obtener tu Instagram Business Account ID desde tu Facebook Page.

**En PowerShell:**
```powershell
$token = "EAA85ZBTtISuABQy1WkLZBrA9naJSLhizDZAHcJnnWbTDJbiXNCq98cZCsKNYZCXrqkZA6JZAZCVdeGbrR3M34MQ437g8S5Yjvi5dVx8vHXQAyTUfZCorLkwexPw6CRRHXCZAEZBO6stdxlnAS5b9xoZA0EZB2lWORySXcRS7x7hoXfOP9EtZBC0omk5qssIVFXVQxZAtrEJRYO8e4KZCHm0igxPl"

# 1. Obtener tu Facebook Page ID
$pages = Invoke-RestMethod -Uri "https://graph.facebook.com/v18.0/me/accounts?access_token=$token"
$pageId = $pages.data[0].id  # O el índice de tu página

# 2. Obtener el Instagram Business Account ID vinculado
$igAccount = Invoke-RestMethod -Uri "https://graph.facebook.com/v18.0/$pageId?fields=instagram_business_account&access_token=$token"
$igUserId = $igAccount.instagram_business_account.id
Write-Host "Instagram User ID: $igUserId"
```

**En Bash/Git Bash:**
```bash
# 1. Obtener Facebook Page ID
curl "https://graph.facebook.com/v18.0/me/accounts?access_token={LONG_LIVED_TOKEN}"

# 2. Obtener Instagram Business Account ID (usando el PAGE_ID obtenido)
curl "https://graph.facebook.com/v18.0/{PAGE_ID}?fields=instagram_business_account&access_token={LONG_LIVED_TOKEN}"
```

### Paso 6: Configurar variables de entorno

```env
INSTAGRAM_ACCESS_TOKEN=tu_token_de_larga_duracion
INSTAGRAM_USER_ID=tu_instagram_user_id
```

### ⚠️ Renovación del Token

El token de larga duración **expira cada 60 días**. Para renovarlo:

**En PowerShell:**
```powershell
$token = "TU_CURRENT_LONG_LIVED_TOKEN"
Invoke-RestMethod -Uri "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=$token"
```

**En Bash/Git Bash:**
```bash
curl -i -X GET "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token={CURRENT_LONG_LIVED_TOKEN}"
```

**Recomendación**: Configurar un recordatorio cada 50 días para renovar el token manualmente, o implementar un cron job de refresh.

### Troubleshooting

- **Widget no aparece**: Si `INSTAGRAM_ACCESS_TOKEN` no está configurado, el widget no se muestra (silenciosamente retorna null). Verificá la variable de entorno.
- **Error de token expirado**: Renovar el token con el endpoint de refresh. Si expiró completamente (>60 días sin renovar), hay que generar uno nuevo desde el paso 3.
- **Imágenes no cargan**: Verificá que los dominios de Instagram (`*.cdninstagram.com` y `*.fbcdn.net`) estén permitidos en `next.config.ts` (ya configurado).

---

## Estructura del Proyecto

```
src/
  app/
    dashboard/       # Home pública: stats, salón de la fama, últimos partidos
    matches/         # Listado y detalle de partidos públicos
    players/         # Listado y perfil de jugadores
    admin/           # Panel admin (protegido): CRUD partidos, jugadores, torneos, pagos
    login/           # Autenticación via Supabase Auth
    api/             # Endpoints: Instagram, MVP voting, Push notifications
  components/        # Componentes UI reutilizables
  lib/               # Utilidades, schemas Zod, clientes Supabase, queries
supabase/
  migrations/        # Migraciones SQL
```
