"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { transition } from "@/lib/motion";

/**
 * Sistema de Toast (feedback efímero, p. ej. "Agregado al carrito" — §10).
 * `ToastProvider` monta un viewport con region aria-live; los componentes
 * disparan toasts con `useToast()`. Entradas/salidas con Framer Motion
 * (neutralizadas por MotionConfig reducedMotion="user").
 */

type ToastVariant = "success" | "info" | "urgency" | "error";

export interface ToastOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
  /** Acción opcional (p. ej. "Ver carrito"). */
  action?: { label: string; onClick: () => void };
}

interface ToastEntry extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, { icon: React.ReactNode; accent: string }> = {
  success: { icon: <CheckCircle2 className="size-5 text-success-strong" aria-hidden />, accent: "border-l-[var(--success)]" },
  info: { icon: <Info className="size-5 text-info-strong" aria-hidden />, accent: "border-l-[var(--info)]" },
  urgency: { icon: <TriangleAlert className="size-5 text-urgency-strong" aria-hidden />, accent: "border-l-[var(--urgency)]" },
  error: { icon: <XCircle className="size-5 text-error-strong" aria-hidden />, accent: "border-l-[var(--error)]" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastEntry[]>([]);
  const idRef = React.useRef(0);
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = React.useCallback(
    (opts: ToastOptions) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, variant: "success", duration: 4000, ...opts }]);
      const duration = opts.duration ?? 4000;
      if (duration !== Infinity) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  React.useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="region"
        aria-label="Notificaciones"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[110] flex flex-col items-center gap-2 p-4 sm:bottom-4 sm:right-4 sm:left-auto sm:items-end"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const v = variantStyles[t.variant ?? "success"];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: transition.micro }}
                transition={transition.standard}
                role="status"
                aria-live="polite"
                className={cn(
                  "pointer-events-auto flex w-[min(92vw,22rem)] items-start gap-3 rounded-[var(--radius-md)] border border-l-4 border-border-default bg-surface p-4 shadow-md",
                  v.accent,
                )}
              >
                <span className="mt-0.5 shrink-0">{v.icon}</span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <p className="text-[15px] font-semibold text-text-primary">{t.title}</p>
                  {t.description && <p className="text-[13px] text-text-secondary">{t.description}</p>}
                  {t.action && (
                    <button
                      type="button"
                      onClick={() => {
                        t.action!.onClick();
                        dismiss(t.id);
                      }}
                      className="mt-1.5 self-start text-[13px] font-semibold text-text-brand underline-offset-2 hover:underline"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Cerrar notificación"
                  onClick={() => dismiss(t.id)}
                  className="-mt-1 -mr-1 inline-flex shrink-0 rounded-full p-1 text-text-muted hover:text-text-primary"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
