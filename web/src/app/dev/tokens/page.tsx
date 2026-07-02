import type { Metadata } from "next";

/**
 * /_dev/tokens — Referencia viva del design system (Etapa 1).
 * Verifica visualmente paleta, tipografía, radios, sombras y estados.
 * Herramienta interna de desarrollo; no es una pantalla de producto.
 *
 * Nota: los valores que varían en bucle se aplican vía CSS vars en `style`
 * (no como clases Tailwind concatenadas, que el scanner estático no detecta).
 */
export const metadata: Metadata = { title: "Design tokens (dev)" };

const SCALE = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

function Ramp({ name, prefix }: { name: string; prefix: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="caption text-text-secondary">{name}</p>
      <div className="flex overflow-hidden rounded-lg shadow-sm">
        {SCALE.map((step) => (
          <div
            key={step}
            className="flex h-16 flex-1 items-end justify-center pb-1"
            style={{ background: `var(--${prefix}-${step})` }}
          >
            <span
              className={`text-[10px] font-semibold ${
                step >= 500 ? "text-white" : "text-neutral-700"
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Swatch({ varName, label }: { varName: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-14 rounded-lg border border-border-default"
        style={{ background: `var(${varName})` }}
      />
      <span className="text-[11px] text-text-secondary">{label}</span>
    </div>
  );
}

export default function TokensPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <header className="mb-12 flex flex-col gap-2">
        <span className="overline text-text-brand">🐾 Manada · Design System</span>
        <h1 className="heading-1 text-text-primary">Design tokens</h1>
        <p className="body-m text-text-secondary">
          Referencia viva de Etapa 1 — paleta, tipografía, radios, sombras y estados.
        </p>
      </header>

      {/* Paleta */}
      <section className="mb-14 flex flex-col gap-6">
        <h2 className="heading-3 text-text-primary">Paleta de marca</h2>
        <Ramp name="Terracota · primario / acción" prefix="terracota" />
        <Ramp name="Pino · secundario / confianza" prefix="pino" />
        <Ramp name="Miel · acento / anticipación" prefix="miel" />
        <Ramp name="Neutros cálidos" prefix="neutral" />
      </section>

      {/* Tipografía */}
      <section className="mb-14 flex flex-col gap-4">
        <h2 className="heading-3 text-text-primary">Tipografía</h2>
        <div className="flex flex-col gap-3 rounded-lg border border-border-default bg-surface p-6 shadow-sm">
          <p className="display-xl">A Toby le quedan ~5 días</p>
          <p className="display-l">Cuidamos a quien más quieres</p>
          <p className="heading-1">Título de página (h1)</p>
          <p className="heading-2">Título de sección (h2)</p>
          <p className="heading-3">Subsección (h3)</p>
          <p className="heading-4">Título de card (h4)</p>
          <p className="body-l">Body L — texto introductorio en Hanken Grotesk.</p>
          <p className="body-m">Body M — cuerpo por defecto, 60–75 caracteres por línea.</p>
          <p className="body-s text-text-secondary">Body S — metadatos y ayuda.</p>
          <p className="overline text-text-secondary">Overline · categorías</p>
          <p className="price text-2xl">$24.990</p>
          <p>
            El nombre de la mascota como acento:{" "}
            <span className="pet-name text-xl">Toby</span>
          </p>
        </div>
      </section>

      {/* Estados semánticos */}
      <section className="mb-14 flex flex-col gap-4">
        <h2 className="heading-3 text-text-primary">Estados semánticos</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Swatch varName="--success-soft" label="success-soft" />
          <Swatch varName="--subscribe-soft" label="subscribe-soft" />
          <Swatch varName="--urgency-soft" label="urgency-soft" />
          <Swatch varName="--info-soft" label="info-soft" />
          <Swatch varName="--error-soft" label="error-soft" />
        </div>
      </section>

      {/* Radios y sombras */}
      <section className="grid gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="heading-3 text-text-primary">Radios</h2>
          <div className="flex flex-wrap gap-4">
            {(["sm", "md", "lg", "xl"] as const).map((r) => (
              <div key={r} className="flex flex-col items-center gap-1.5">
                <div
                  className="size-16 border border-terracota-200 bg-brand-soft"
                  style={{ borderRadius: `var(--radius-${r})` }}
                />
                <span className="text-[11px] text-text-secondary">{r}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="heading-3 text-text-primary">Sombras cálidas</h2>
          <div className="flex flex-wrap gap-5">
            {(["xs", "sm", "md", "lg"] as const).map((s) => (
              <div key={s} className="flex flex-col items-center gap-1.5">
                <div
                  className="size-16 rounded-lg bg-surface"
                  style={{ boxShadow: `var(--shadow-${s})` }}
                />
                <span className="text-[11px] text-text-secondary">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
