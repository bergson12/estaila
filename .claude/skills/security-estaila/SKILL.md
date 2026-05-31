---
name: security-estaila
description: >-
  Guía y checklist de seguridad accionable y ESPECÍFICA del proyecto estaila (Next.js 16
  Server Actions + Prisma/Turso + Better-Auth + Vercel Blob + pagos LemonSqueezy/PayPal).
  Úsala SIEMPRE que el usuario pida revisar seguridad, auditar o endurecer (hardening)
  un endpoint, server action, route handler o webhook; cuando se escriba o modifique
  código que toque autenticación, autorización, queries a la base de datos, uploads,
  secrets o pagos; y SIEMPRE antes de un deploy a producción. Cubre AuthZ/IDOR en
  server actions, validación con zod, SQL injection vía $executeRawUnsafe, manejo de
  secrets, rate limiting (gap P-018), uploads a Blob, XSS con dangerouslySetInnerHTML,
  verificación de firmas HMAC en webhooks, rutas públicas y un checklist pre-deploy.
  Actívala aunque el usuario solo diga "revisa esto", "¿esto es seguro?", "audita el
  módulo X" o mencione seguridad de forma vaga.
---

# Security Best Practices — estaila

Guía de revisión de seguridad **específica de este proyecto**. No es una lista genérica:
cada sección apunta a un patrón real del código y dice qué buscar, qué está mal y cómo
se arregla.

## Cómo usar esta skill

1. Identifica qué tipo de código se está tocando (server action, route handler, webhook, componente, upload…).
2. Recorre las secciones relevantes **una por una** — no asumas que algo está bien sin verlo.
3. Para cada hallazgo: cita `archivo:línea`, severidad (Alta/Media/Baja), por qué es explotable y el fix concreto.
4. Antes de un deploy, corre el **checklist final**.

Principio rector: en este stack el servidor es la única frontera de confianza. Todo lo
que venga del cliente (formularios, params, headers, body de webhooks, nombres de archivo)
es **dato no confiable** hasta validarlo. El código cliente (`"use client"`) no protege nada.

---

## 1. AuthZ + IDOR en Server Actions

**El riesgo #1 del proyecto.** Un server action es un endpoint HTTP público. Autenticar
(`requireUser`) NO basta: hay que verificar que el recurso **pertenece** a ese usuario,
o cualquier usuario logueado puede leer/editar recursos ajenos cambiando un `id` (IDOR).

Patrón canónico del proyecto (`lib/actions/ai-text.ts`): el `userId` va **dentro del `where`**,
nunca solo en un check posterior.

```ts
// ✅ CORRECTO — ownership forzado en la query. Si no es suya, devuelve null.
const user = await requireUser();
const conv = await prisma.chatConversation.findFirst({
  where: { id: conversationId, userId: user.id },
});
if (!conv) throw new Error("No encontrado");
```

```ts
// ❌ MAL — IDOR. Trae el recurso por id sin atar al dueño.
const user = await requireUser();               // autenticado, pero…
const conv = await prisma.chatConversation.findUnique({
  where: { id: conversationId },                // …puede ser de OTRO usuario
});
return conv;                                    // fuga de datos ajenos
```

Qué revisar en cada action:
- ¿Empieza con `requireUser()` (o `requireAdmin` para `/admin/*`)? Server actions sin auth = público total.
- ¿Toda lectura/escritura/borrado de un recurso del usuario incluye `userId: user.id` (o un join al dueño) en el `where`?
- `update`/`delete` con solo `where: { id }` son IDOR salvo que sean acciones de admin (`lib/actions/admin.ts` usa `where: { id: userId }` legítimamente porque ya pasó `requireAdmin`).
- Recursos anidados (un documento de una propiedad): verifica el dueño **a través de la relación**, no confíes en el id hijo.

Severidad típica: **Alta** (acceso no autorizado a datos de otros agentes / sus leads / sus clientes).

---

## 2. Validación de input (zod)

Cada server action valida su entrada con zod **antes** de tocar la DB. Sin esto, llegan
tipos inesperados, strings gigantes o campos que no deberían existir.

Referencia buena: `lib/actions/lead.ts` (`PublicLeadSchema`).

```ts
const Schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional(),
  honeypot: z.string().optional(),       // trampa anti-bot: si viene lleno → bot
});

export async function action(input: z.infer<typeof Schema>) {
  const data = Schema.parse(input);       // lanza si no valida
  if (data.honeypot) return { ok: true }; // silencioso para bots
  // …
}
```

Qué revisar:
- `.max(...)` en todo string libre (evita payloads gigantes y abuso de almacenamiento/IA).
- Inputs públicos (lead, contacto desde portal): honeypot + “al menos un canal de contacto”.
- No pasar `input` crudo a Prisma `data: {...}` sin filtrar campos (riesgo de mass-assignment de campos sensibles como `plan`, `credits`, `role`).
- Enums/valores cerrados (status, plan, tipo) validados contra una lista, no `z.string()` libre.

Severidad: **Media** (a veces Alta si permite escribir campos privilegiados).

---

## 3. SQL injection — `$executeRawUnsafe` / `$queryRawUnsafe`

El proyecto usa SQL crudo en `lib/db.ts`, `lib/actions/email-campaign.ts`, `lib/actions/ai-text.ts`,
`lib/actions/support.ts` (sobre todo para `CREATE TABLE IF NOT EXISTS` en Turso). Esto es
**seguro solo mientras el string sea 100% estático**. El día que alguien interpole input de
usuario en `...Unsafe`, es SQL injection directa.

```ts
// ✅ CORRECTO — DDL estática, sin input de usuario. Uso legítimo de Unsafe.
await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS EmailCampaign (...)`);

// ✅ CORRECTO — si necesitas un valor dinámico, usa la versión PARAMETRIZADA (tagged template).
const rows = await prisma.$queryRaw`SELECT * FROM Lead WHERE email = ${userEmail}`;
//                         ^ $queryRaw (sin "Unsafe") parametriza ${...} de forma segura
```

```ts
// ❌ MAL — concatenar input → injection.
await prisma.$queryRawUnsafe(`SELECT * FROM Lead WHERE email = '${userEmail}'`);
```

Regla: **`$queryRaw` / `$executeRaw` (tagged template) parametrizan y son seguros**.
`$queryRawUnsafe` / `$executeRawUnsafe` solo para SQL constante sin datos del usuario.
Si ves `Unsafe` + un `${`/`+` con algo que no sea constante de código → marcar.

Severidad: **Alta** (exfiltración / borrado de toda la DB).

---

## 4. Secrets y datos sensibles

- Secrets (`GEMINI_API_KEY`, `DEEPSEEK_*`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `TURSO_*`,
  `LEMONSQUEEZY_*`, `PAYPAL_*`, `BETTER_AUTH_SECRET`) viven en `.env` (gitignored) y en las
  env vars de Vercel. **Nunca** en el repo, **nunca** pegados en el chat, **nunca** en logs.
- Cualquier var con prefijo `NEXT_PUBLIC_` se **empaqueta en el bundle del cliente** y es
  pública. Solo URLs/IDs públicos ahí (ej. `NEXT_PUBLIC_APP_URL`, token público de Mapbox).
  Un secret en `NEXT_PUBLIC_*` está comprometido.
- No `console.log` de keys, tokens, password hashes ni del body crudo de webhooks. Loguear
  URLs/ids está bien; loguear secrets/PII no.
- No exponer `error.message` crudo de la DB/infra al cliente si revela rutas, SQL o nombres internos.

Qué revisar: grep de `process.env.` en archivos `"use client"` / componentes; cualquier
`NEXT_PUBLIC_` que parezca un secret; `console.log`/`console.error` cerca de keys o de `req.body`.

Severidad: **Alta**.

---

## 5. Rate limiting (gap conocido — P-018)

Estado actual del proyecto:
- ✅ El lead público (`lib/actions/lead.ts`) limita por IP+propiedad (1/60s) — **patrón de referencia** (ver §9).
- ⚠️ Better-Auth NO tiene `rateLimit` explícito en `lib/auth.ts`. Su default es **en memoria por instancia**, inútil en Vercel serverless (multi-lambda) contra fuerza bruta distribuida.
- ❌ Endpoints caros sin límite por usuario: **Studio IA (Gemini)** y **chat (DeepSeek)**. Solo los frena `requireUser` + el sistema de créditos (controla costo, no frecuencia). Un usuario puede martillar y agotar créditos / disparar costo.
- `proxy.ts` excluye `/api` del matcher → no hay capa de rate limit en middleware.

Recomendación (cuando se implemente):
```ts
// @upstash/ratelimit con sliding window por userId
const { success } = await ratelimit.limit(`ai:${user.id}`);
if (!success) throw new Error("Demasiadas solicitudes. Espera un momento.");
```
- Para auth: configurar `rateLimit` en Better-Auth + `secondaryStorage` (Upstash Redis) → distribuido.
- Tokens de Upstash en `.env` local / Vercel, **nunca en el chat**.

Severidad: **Media** (abuso de costo, fuerza bruta). No bloquea features, pero sí antes de escalar tráfico.

---

## 6. Uploads (Vercel Blob)

- Validar **content-type real** y **tamaño máximo** en el servidor; no confiar en la extensión ni en el MIME que manda el cliente.
- Generar nombres aleatorios para el blob (no usar el filename del usuario tal cual → evita path/colisión y caracteres raros).
- Restringir a tipos esperados (imágenes para Studio/avatares; PDFs para documentos). Rechazar SVG si se va a servir inline (puede llevar `<script>`).
- El upload debe exigir `requireUser` y atar el blob al usuario.

Qué revisar: handlers de upload y `put()` de `@vercel/blob` — ¿hay tope de tamaño? ¿se valida tipo? ¿el nombre es aleatorio?

Severidad: **Media** (Alta si se sirve contenido subido sin validar tipo).

---

## 7. XSS — `dangerouslySetInnerHTML`

React escapa por defecto; el único agujero de XSS habitual es `dangerouslySetInnerHTML`.
Usos actuales en el repo:
- `app/welcome/page.tsx` y `app/propiedad/[slug]/page.tsx` → **JSON-LD estático/controlado**. Seguro **si** el contenido no mezcla input de usuario sin escapar. Si se inyecta título/descripcción de propiedad en el JSON-LD, escapar `<`/`>`/`&` y `</script>`.
- `components/properties/documents/document-dialog.tsx` y `templates-manager.tsx` → renderizan HTML de plantillas/documentos. **Punto a auditar**: si ese HTML puede contener algo escrito por el usuario y se inyecta sin sanitizar, es XSS almacenado.

Regla:
```tsx
// ❌ MAL — HTML de origen no confiable directo al DOM
<div dangerouslySetInnerHTML={{ __html: userProvidedHtml }} />

// ✅ CORRECTO — sanitizar primero (p.ej. con una allowlist tipo DOMPurify/sanitize-html)
<div dangerouslySetInnerHTML={{ __html: sanitize(userProvidedHtml) }} />
```
Si el HTML es generado por IA a partir de input del usuario, trátalo como no confiable igual.

Qué revisar: cada `dangerouslySetInnerHTML` → ¿de dónde sale `__html`? Si la cadena toca datos
de usuario/contacto/propiedad sin sanitizar → marcar Alta. JSON-LD puramente estático → OK.

Severidad: **Alta** si hay input de usuario; **Baja/N-A** si es estático.

---

## 8. Webhooks — verificación de firma

Buen patrón (`app/api/lemonsqueezy/webhook/route.ts`): se lee el **body crudo**, se verifica
`X-Signature` = HMAC-SHA256(body, secret) **antes** de procesar, y se devuelve 401 si no valida.

```ts
const raw = await req.text();                       // raw body (NO req.json() antes de verificar)
const sig = req.headers.get("x-signature");
const valid = await verifyWebhookSignature(raw, sig).catch(() => false);
if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
// recién aquí parsear y actuar
```

Qué revisar:
- ¿Se verifica firma **antes** de cualquier efecto (crear suscripción, dar créditos, cambiar plan)? Un webhook sin verificar = cualquiera puede regalarse plan AGENCY haciendo un POST.
- La comparación de firmas debe ser **timing-safe** (`crypto.timingSafeEqual`), no `===`.
- ⚠️ `app/api/paypal/webhook/route.ts` **salta la verificación cuando no hay webhook ID configurado** (“skip in early dev”). Aceptable en dev, pero en **producción el webhook ID DEBE estar seteado** o el endpoint queda abierto. Verificar env de prod.
- Idempotencia: reintentos del proveedor no deben duplicar créditos/efectos.

Severidad: **Alta** (fraude de pagos / escalada de plan).

---

## 9. Rutas públicas (`proxy.ts`)

`proxy.ts` (middleware Next 16) deja públicas: `/`, `/p/`, `/c/`, `/welcome`, `/invitacion`,
`/propiedad/`, `/legal/`. El resto exige sesión. Ojo:
- El middleware **excluye `/api`** del matcher → los route handlers se protegen **ellos mismos**, no el middleware. No asumas que `/api/*` está autenticado por estar “detrás del login”.
- Todo lo que sirva una ruta pública (portal `/p/`, tarjeta `/c/`, propiedad `/propiedad/`) solo debe exponer datos marcados como públicos (`publicEnabled`, `isActive`). Verificar que el query filtra por esos flags (ej. `lib/actions/lead.ts` rechaza si `!property.publicEnabled`).
- Patrón de referencia anti-spam en endpoint público (reutilizable): hash de IP + recurso y ventana temporal.
```ts
const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
const ipHash = createHash("sha256").update(ip + ":" + property.id).digest("hex").slice(0, 32);
const recent = await prisma.lead.findFirst({
  where: { propertyId: property.id, ipHash, createdAt: { gte: new Date(Date.now() - 60_000) } },
});
if (recent) throw new Error("Ya enviaste un mensaje.");
```

Severidad: **Media/Alta** según qué dato se filtre.

---

## 10. Checklist final pre-deploy

Recórrelo antes de pushear a `main` (Vercel auto-deploya):

- [ ] **AuthZ**: cada server action nuevo/modificado llama `requireUser`/`requireAdmin` y filtra por `userId` en el `where` (sin IDOR).
- [ ] **Validación**: input validado con zod, con `.max()` en strings; sin mass-assignment de `plan`/`credits`/`role`.
- [ ] **SQL**: ningún `...Unsafe` con input de usuario interpolado; valores dinámicos vía `$queryRaw` tagged template.
- [ ] **Secrets**: nada nuevo en el repo/chat; ningún secret en `NEXT_PUBLIC_*`; sin `console.log` de keys/PII; errores al cliente sin detalles internos.
- [ ] **Uploads**: tope de tamaño + validación de tipo + nombre aleatorio + `requireUser`.
- [ ] **XSS**: cada `dangerouslySetInnerHTML` revisado; sanitizar si toca datos de usuario.
- [ ] **Webhooks**: firma verificada antes de efectos; comparación timing-safe; webhook IDs/secrets configurados en env de **producción** (PayPal incluido).
- [ ] **Rutas públicas**: solo datos con flag público; `/api/*` se autoprotege.
- [ ] **Rate limiting**: si tocaste endpoints de IA/auth, considerar el gap P-018.
- [ ] **Env de producción**: todas las env vars necesarias seteadas en Vercel (no solo en `.env` local).

Salida esperada de una auditoría: lista de hallazgos con `archivo:línea`, severidad, escenario
de explotación y fix. Si no hay hallazgos, dilo explícito y nombra qué categorías revisaste.
