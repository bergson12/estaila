# Lemon Squeezy — Setup Guide

estaila usa **Lemon Squeezy** como proveedor principal de pagos (Merchant of Record). LS maneja:
- Procesamiento global (Visa/MC/Amex, PayPal, Apple Pay, Google Pay)
- Compliance fiscal (IVA UE, sales tax US, RD)
- Suscripciones + pagos one-time
- Customer portal (cancelar / cambiar tarjeta / facturas)

**Fee**: 5% + $0.50 USD por transacción (vs Stripe 2.9% + $0.30 — pero LS es MoR, te ahorras el lío fiscal).

PayPal queda como fallback para usuarios que prefieran.

---

## 1. Crear cuenta Lemon Squeezy

1. Ve a https://lemonsqueezy.com → **Sign up**
2. Verifica email
3. Completa **KYC** (Settings → Account):
   - Nombre legal
   - Dirección RD
   - Cédula / pasaporte (foto)
   - Aprobación 24–48h
4. Conectar cuenta bancaria USD (RD funciona)

---

## 2. Crear Store

Settings → **Stores → New Store**

| Campo | Valor |
|---|---|
| Name | `estaila` |
| Default currency | `USD` |
| Tax inclusive | No |

Anota el **Store ID** (numérico) → va en `LEMONSQUEEZY_STORE_ID`.

---

## 3. Crear API Key

Settings → **API → New API Key**

- Scopes: marca **todos** (lectura + escritura + checkouts)
- Anota el token → va en `LEMONSQUEEZY_API_KEY`
- Se muestra **una sola vez** — guárdalo seguro

---

## 4. Crear productos (9 variants total)

### 4.1 Suscripciones (6 variants)

Products → **New Product** → tipo **Subscription**

**Producto: Pro**
- Description: "Plan Pro — 50 créditos IA mensuales · propiedades ilimitadas"
- Variants:
  - Variant 1: `$15 / month` (Monthly)
  - Variant 2: `$144 / year` (Yearly, ahorro ~20%)

**Producto: Team**
- Description: "Plan Team — 200 créditos IA mensuales · 5 asientos · branding"
- Variants:
  - Variant 1: `$39 / month`
  - Variant 2: `$374 / year`

**Producto: Agency**
- Description: "Plan Agency — 1000 créditos IA mensuales · 15 asientos · dominio · white-label"
- Variants:
  - Variant 1: `$79 / month`
  - Variant 2: `$758 / year`

### 4.2 Credit packs (3 variants, one-time)

Products → **New Product** → tipo **Pay once**

**Producto: Credit Pack 20**
- Price: `$9` one-time
- Description: "20 créditos IA extra (no caducan)"

**Producto: Credit Pack 50**
- Price: `$19`
- Description: "50 créditos IA extra"

**Producto: Credit Pack 150**
- Price: `$49`
- Description: "150 créditos IA extra"

### 4.3 Copiar Variant IDs

Click cada producto → cada variante muestra su **Variant ID** (numérico). Pega en `.env`:

```bash
LEMONSQUEEZY_VARIANT_PRO_MONTHLY=12345
LEMONSQUEEZY_VARIANT_PRO_YEARLY=12346
LEMONSQUEEZY_VARIANT_TEAM_MONTHLY=12347
LEMONSQUEEZY_VARIANT_TEAM_YEARLY=12348
LEMONSQUEEZY_VARIANT_AGENCY_MONTHLY=12349
LEMONSQUEEZY_VARIANT_AGENCY_YEARLY=12350
LEMONSQUEEZY_VARIANT_PACK_20=12351
LEMONSQUEEZY_VARIANT_PACK_50=12352
LEMONSQUEEZY_VARIANT_PACK_150=12353
```

---

## 5. Configurar Webhook

Settings → **Webhooks → Create webhook**

- **URL**: `https://TU-DOMINIO.com/api/lemonsqueezy/webhook`
  - Dev local: usa [ngrok](https://ngrok.com) → `ngrok http 3000` → URL pública temporal
- **Signing secret**: LS genera uno automático — cópialo → `LEMONSQUEEZY_WEBHOOK_SECRET`
- **Events** (marcar todos los siguientes):
  - `subscription_created`
  - `subscription_updated`
  - `subscription_cancelled`
  - `subscription_resumed`
  - `subscription_expired`
  - `subscription_payment_success`
  - `subscription_payment_failed`
  - `subscription_payment_refunded`
  - `order_created`
  - `order_refunded`

Click **Test** para enviar un ping. Tu endpoint debe responder 200 OK.

---

## 6. Variables de entorno completas

Edita `.env`:

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"

LEMONSQUEEZY_API_KEY="ls_..."
LEMONSQUEEZY_STORE_ID="12345"
LEMONSQUEEZY_WEBHOOK_SECRET="whsec_..."

LEMONSQUEEZY_VARIANT_PRO_MONTHLY="12345"
LEMONSQUEEZY_VARIANT_PRO_YEARLY="12346"
LEMONSQUEEZY_VARIANT_TEAM_MONTHLY="12347"
LEMONSQUEEZY_VARIANT_TEAM_YEARLY="12348"
LEMONSQUEEZY_VARIANT_AGENCY_MONTHLY="12349"
LEMONSQUEEZY_VARIANT_AGENCY_YEARLY="12350"
LEMONSQUEEZY_VARIANT_PACK_20="12351"
LEMONSQUEEZY_VARIANT_PACK_50="12352"
LEMONSQUEEZY_VARIANT_PACK_150="12353"
```

En producción usa el `LEMONSQUEEZY_API_KEY` real (no test) y `NEXT_PUBLIC_APP_URL` apuntando a tu dominio.

---

## 7. Probar el flujo

1. `pnpm dev` → http://localhost:3000
2. Ve a `/pricing`
3. Botón "Suscribirme a Pro" → debe redirigir a checkout LS
4. Usa tarjeta de prueba (modo test): `4242 4242 4242 4242`, exp `12/30`, CVV `123`
5. Completa checkout → debes ser redirigido a `/billing/success`
6. Verifica en DB:
   ```sql
   SELECT plan, lsSubId, lsCustomerId, planActive FROM user WHERE email='tu@email';
   ```
7. Verifica BillingEvent:
   ```sql
   SELECT type, provider, reference FROM BillingEvent ORDER BY createdAt DESC LIMIT 5;
   ```

---

## 8. Customer Portal

Usuario suscrito ve botón **Administrar** en `/pricing` → abre Customer Portal de LS donde puede:
- Cambiar tarjeta
- Ver facturas / descargar PDF
- Pausar suscripción
- Cancelar (sigue activa hasta `ends_at`)

---

## 9. Pasos a producción

1. Cambiar `LEMONSQUEEZY_API_KEY` por la production key
2. Crear webhook **separado** para producción (otro signing secret)
3. Crear productos en modo **Live** (LS no distingue test/live por API key — los productos son los mismos)
4. Verificar que tu cuenta esté **Activated** (KYC aprobado) — sin activación, los pagos test funcionan pero no procesa cards reales
5. Configurar bank account para payouts (Settings → Payments)

---

## 10. Coexistencia con PayPal

Mientras tengas ambos providers configurados:
- **LS** se muestra como botón primario
- **PayPal** aparece como botón secundario "Pagar con PayPal"

Si solo configuras uno, ese se vuelve el único disponible.

Cada usuario queda atado al provider con el que pagó (`user.billingProvider`). Cancelaciones / portal usan ese provider.

---

## Troubleshooting

**"Variante LS no configurada para PRO monthly"**
→ Falta `LEMONSQUEEZY_VARIANT_PRO_MONTHLY` en .env. Reinicia dev tras editar `.env`.

**Webhook devuelve 401 "Invalid signature"**
→ El `LEMONSQUEEZY_WEBHOOK_SECRET` no coincide con el del dashboard LS. Re-copia desde Settings → Webhooks.

**Webhook recibe evento pero el plan no se actualiza**
→ El `custom_data.user_id` no llegó. Verifica que el checkout usa el server action `createLemonCheckout` (no checkout manual desde LS dashboard).

**Suscripción cancelada pero usuario sigue con plan activo**
→ Es esperado. LS marca `cancelled: true` pero la sub sigue activa hasta `ends_at`. Cuando expira llega `subscription_expired` y se desactiva.

**Necesito hacer testing local del webhook**
→ Usa ngrok: `ngrok http 3000` → copia URL pública → crea webhook en dashboard apuntando a `https://xxx.ngrok.io/api/lemonsqueezy/webhook` → test events desde LS dashboard.
