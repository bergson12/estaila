# Backup diario → Google Drive

Sistema automático que respalda **Turso DB + Vercel Blob assets** todos los días
a las 02:00 (LATAM) en Google Drive.

## Qué hace el workflow

Corre `.github/workflows/daily-backup.yml` todos los días:

1. **Dump completo de Turso** (schema + datos) → `estaila-2026-05-28.sql.gz`
2. **Mirror de Vercel Blob** (todas las fotos, AI gen, covers) + `manifest.json`
3. Sube a Google Drive vía rclone:
   - `estaila-backups/daily/2026-05-28/` (se borra a los 90 días)
   - `estaila-backups/monthly/2026-05/` (solo el día 1 de cada mes, **se conserva para siempre**)
4. Si falla, te llega email a `bergson@estaila.com` vía Resend

## Setup inicial — 3 pasos

### 1. Configurar rclone con Google Drive (localmente, 1 vez)

En tu PC instala rclone y autoriza Google Drive:

```bash
# Windows: descarga https://rclone.org/downloads/ o:
choco install rclone

# Configurar (interactivo)
rclone config

# Responder:
# n) New remote
# name> drive
# Storage> Google Drive (escoge el numero)
# client_id> [Enter] (deja default — usa el de rclone, OK para uso personal)
# client_secret> [Enter]
# scope> 1 (Full access)
# service_account_file> [Enter]
# Edit advanced config> n
# Use auto config> y  (abre browser, login con tu Google)
# Configure this as a Shared Drive> n
# y) Yes this is OK

# Test:
rclone lsd drive:
# Deberias ver tus carpetas de Drive
```

Una vez funcionando, **copia el contenido de tu archivo de configuración**:

```bash
# Windows
type %APPDATA%\rclone\rclone.conf

# Mac/Linux
cat ~/.config/rclone/rclone.conf
```

Copia TODO el output (incluye `[drive]`, `type =`, `token =`, etc).

### 2. Agregar secrets en GitHub

Andate a https://github.com/bergson12/estaila/settings/secrets/actions y crea:

| Nombre | Valor |
|---|---|
| `DATABASE_URL` | `libsql://estaila-bergson12.aws-us-east-2.turso.io` |
| `TURSO_AUTH_TOKEN` | (tu token Turso) |
| `BLOB_READ_WRITE_TOKEN` | (lo sacas de Vercel env vars) |
| `RCLONE_CONFIG` | (todo el contenido del rclone.conf que copiaste) |
| `RESEND_API_KEY` | (tu API key de Resend — sácala de resend.com → API Keys; NO la pegues en archivos versionados) |

**IMPORTANTE — el rclone.conf**: pégalo TAL CUAL, con saltos de línea reales,
empezando con `[drive]`. GitHub Secrets soporta multi-línea.

### 3. Probar manualmente

1. https://github.com/bergson12/estaila/actions
2. Click en **"Daily Backup → Google Drive"**
3. **Run workflow** → branch `main` → Run
4. Ver progreso en vivo (~2-15 min según volumen)
5. Si todo OK, vas a tu Drive y deberías ver `estaila-backups/daily/2026-05-28/`

## Estructura en Drive

```
📁 estaila-backups/
├── 📁 daily/
│   ├── 2026-05-28/
│   │   ├── 📁 db/
│   │   │   └── estaila-2026-05-28.sql.gz
│   │   └── 📁 blob/
│   │       ├── manifest.json
│   │       └── 📁 files/
│   │           └── ... (estructura de pathnames en Vercel Blob)
│   └── 2026-05-27/  (igual)
└── 📁 monthly/
    ├── 2026-05/  (snapshot del 1 de mayo)
    ├── 2026-04/  (snapshot del 1 de abril)
    └── ...       (se conservan para siempre)
```

## Restore — cómo recuperar desde un backup

### Recuperar DB:

```bash
# 1. Descarga el SQL del día que necesites
rclone copy "drive:estaila-backups/daily/2026-05-28/db/" ./
gunzip estaila-2026-05-28.sql.gz

# 2. Crear una DB Turso nueva (NO sobreescribir la actual)
npx turso db create estaila-restored

# 3. Aplicar el SQL
npx turso db shell estaila-restored < estaila-2026-05-28.sql

# 4. Cambiar DATABASE_URL en Vercel a la nueva
```

### Recuperar archivos:

```bash
# Bajar todo el blob de un día
rclone copy "drive:estaila-backups/daily/2026-05-28/blob/" ./restored-blobs/

# Los archivos vienen organizados por pathname original
# Para subir todo de vuelta a Vercel Blob, escribir un script con @vercel/blob put()
```

## Costos

- **GitHub Actions:** GRATIS hasta 2000 min/mes (free tier). El backup tarda ~5-15 min/día = ~150-450 min/mes. Sobra.
- **Google Drive:** GRATIS hasta los 1TB que ya tenés.
- **Vercel Blob egress:** $0.05/GB. Si tu Blob es 10GB → $0.50/día → ~$15/mes.
  - Si querés ahorrar: cambia el día de mirror Blob a semanal (mantén DB diaria).

## Cómo hacer la primera prueba

Mientras configures, podés correr el dump local:

```bash
# .env debe tener DATABASE_URL=libsql://... y TURSO_AUTH_TOKEN=...
pnpm tsx scripts/backup/dump-turso.ts ./test-backup.sql
gzip ./test-backup.sql
ls -lh ./test-backup.sql.gz
```

Si genera el archivo, el dump funciona. Mismo para blob:

```bash
pnpm tsx scripts/backup/mirror-blob.ts ./test-blobs
ls -R ./test-blobs/files | head
```
