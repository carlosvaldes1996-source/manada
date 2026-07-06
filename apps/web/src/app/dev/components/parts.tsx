"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Andamiaje del styleguide (no forma parte de la librería). */

export interface SectionDef {
  id: string;
  label: string;
}

/** Sección con ancla para el índice lateral. */
export function GuideSection({ id, title, blurb, children }: { id: string; title: string; blurb?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border-default py-12 first:border-0">
      <h2 className="heading-2 text-text-primary">{title}</h2>
      {blurb && <p className="body-m mt-1 max-w-2xl text-text-secondary">{blurb}</p>}
      <div className="mt-6 flex flex-col gap-8">{children}</div>
    </section>
  );
}

/** Bloque de un componente: nombre, "cuándo usar" y el lienzo de ejemplos. */
export function Demo({ name, when, children, canvasClassName }: { name: string; when: string; children: React.ReactNode; canvasClassName?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="heading-4 text-text-primary">{name}</h3>
        <p className="text-[13px] text-text-secondary">{when}</p>
      </div>
      <div className={cn("flex flex-wrap items-start gap-4 rounded-[var(--radius-lg)] border border-border-default bg-canvas p-6", canvasClassName)}>
        {children}
      </div>
    </div>
  );
}

/** Etiqueta de variante sobre un ejemplo. */
export function Labeled({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {children}
      <span className="text-[11px] text-text-muted">{label}</span>
    </div>
  );
}
