import { ArrowLeft, Check, CreditCard, Shield, X } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Política de reembolsos · Estaila",
  description:
    "Política clara y justa de reembolsos para suscripciones y créditos de Estaila.",
};

export default function ReembolsosPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a estaila
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Shield className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Política de reembolsos
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Última actualización: {new Date().toLocaleDateString("es-DO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
          <p className="lead">
            En Estaila valoramos tu confianza. Esta política establece cuándo y
            cómo procesamos reembolsos, de forma justa para ti y sostenible
            para el servicio.
          </p>

          {/* Resumen visual */}
          <div className="not-prose my-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PolicyCard
              icon={Check}
              tone="ok"
              title="14 días sin preguntas"
              body="Cancelación + reembolso completo dentro de los primeros 14 días de tu primera suscripción."
            />
            <PolicyCard
              icon={Check}
              tone="ok"
              title="Anual prorrateado"
              body="Plan anual: hasta 30 días post-compra recibes reembolso prorrateado del tiempo no usado."
            />
            <PolicyCard
              icon={X}
              tone="ko"
              title="Créditos consumidos"
              body="Los créditos IA gastados (imágenes generadas, mensajes chatbot) no son reembolsables."
            />
            <PolicyCard
              icon={X}
              tone="ko"
              title="Cobro mensual recurrente"
              body="Después de 14 días el cobro mensual no es reembolsable. Cancela en cualquier momento y termina al cierre del período."
            />
          </div>

          <h2>1. Período de garantía (14 días)</h2>
          <p>
            Si te suscribes a un plan pagado <strong>por primera vez</strong> y
            no quedas satisfecho, tienes <strong>14 días naturales</strong>{" "}
            desde la fecha de cobro para solicitar reembolso completo, sin
            justificación.
          </p>
          <p>
            Aplica solo a la <strong>primera suscripción</strong>. Si cancelas
            y vuelves a suscribirte después, no se renueva la garantía.
          </p>

          <h2>2. Planes anuales</h2>
          <p>
            Compras anuales tienen una garantía extendida de{" "}
            <strong>30 días desde la fecha de cobro</strong>. Pasado ese
            período, se aplica reembolso <strong>prorrateado</strong> del
            tiempo restante no usado, descontando:
          </p>
          <ul>
            <li>El descuento anual aplicado (típicamente 20-25%)</li>
            <li>Comisiones del procesador de pago (5-8%)</li>
            <li>Cualquier crédito IA ya consumido al precio mensual unitario</li>
          </ul>

          <h2>3. Créditos IA y packs</h2>
          <p>
            Los créditos para Studio IA (generación de imágenes, análisis de
            fotos, chatbot) son <strong>no reembolsables una vez consumidos</strong>.
          </p>
          <p>
            <strong>Excepción</strong>: si una generación falla por error
            técnico de nuestro lado (Gemini timeout, servidor caído), los
            créditos se reembolsan <strong>automáticamente</strong> a tu cuenta.
            No tienes que pedirlo.
          </p>
          <p>
            Packs de créditos comprados aparte (50/200/500 créditos) tienen{" "}
            <strong>30 días de devolución</strong> sobre el balance no usado,
            valorado al precio unitario del pack.
          </p>

          <h2>4. Cobros mensuales recurrentes</h2>
          <p>
            El cobro mensual después de los primeros 14 días{" "}
            <strong>no es reembolsable</strong>. Sin embargo, puedes:
          </p>
          <ul>
            <li>Cancelar en cualquier momento desde <code>/empresa → Facturación</code></li>
            <li>Continúas con acceso completo hasta el cierre del período cobrado</li>
            <li>No se realizan más cobros tras la cancelación</li>
            <li>Tus datos quedan accesibles 90 días post-cancelación (descarga / reactivación)</li>
          </ul>

          <h2>5. Casos especiales con reembolso garantizado</h2>
          <p>
            Procesamos reembolso completo o parcial en estos casos sin
            importar el tiempo transcurrido:
          </p>
          <ul>
            <li>
              <strong>Cobro duplicado</strong> por error del sistema
            </li>
            <li>
              <strong>Cargo no autorizado</strong> (fraude, accidente)
            </li>
            <li>
              <strong>Caída prolongada del servicio</strong> ({">"}48h continuas) sin acceso al producto
            </li>
            <li>
              <strong>Cierre del servicio</strong> Estaila — reembolso prorrateado del tiempo restante
            </li>
          </ul>

          <h2>6. Cómo solicitar reembolso</h2>
          <ol>
            <li>
              Abre un ticket en{" "}
              <Link href="/soporte" className="text-primary underline">
                /soporte
              </Link>{" "}
              con categoría <strong>"Cobros / suscripción"</strong>
            </li>
            <li>
              Incluye: ID de la transacción (o último dígitos de la tarjeta),
              fecha del cobro, y motivo
            </li>
            <li>
              Respondemos en máx <strong>48 horas hábiles</strong>
            </li>
            <li>
              Si aprobamos, el reembolso aparece en tu método de pago en{" "}
              <strong>5-10 días hábiles</strong> (depende del banco / procesador)
            </li>
          </ol>

          <h2>7. Procesadores de pago</h2>
          <p>
            Estaila utiliza <strong>Lemon Squeezy</strong> (Merchant of Record)
            para suscripciones y <strong>PayPal</strong> para packs únicos.
            Ambos manejan los reembolsos según sus propias políticas de
            disputas, que respetamos.
          </p>

          <h2>8. Cambios a esta política</h2>
          <p>
            Podemos actualizar esta política. Cambios materiales se anuncian
            por email con <strong>30 días de antelación</strong> antes de
            aplicarse. La fecha en el encabezado refleja la última versión.
          </p>

          <h2>9. Contacto</h2>
          <p>
            ¿Dudas sobre esta política? Escríbenos a{" "}
            <a
              href="mailto:billing@estaila.com"
              className="text-primary underline"
            >
              billing@estaila.com
            </a>{" "}
            o abre un ticket en{" "}
            <Link href="/soporte" className="text-primary underline">
              /soporte
            </Link>
            .
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-xl border border-primary/30 bg-primary/5 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                ¿Necesitas un reembolso ahora?
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Abre un ticket y un miembro del equipo lo procesa en máx 48h.
              </p>
              <Link
                href="/soporte"
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Abrir ticket
                <ArrowLeft className="h-3 w-3 rotate-180" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-10 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} estaila · CRM + AI Studio
        </p>
      </div>
    </div>
  );
}

function PolicyCard({
  icon: Icon,
  tone,
  title,
  body,
}: {
  icon: typeof Check;
  tone: "ok" | "ko";
  title: string;
  body: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        tone === "ok"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-amber-500/30 bg-amber-500/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            tone === "ok"
              ? "bg-emerald-500/15 text-emerald-600"
              : "bg-amber-500/15 text-amber-600"
          }`}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
