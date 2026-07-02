"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

/**
 * Tooltip accesible (Radix). Envuelve la app (o un subtree) en <TooltipProvider>
 * una vez; cada <Tooltip> agrupa trigger + contenido. Para info esencial usar
 * Popover/Texto visible (un tooltip no debe esconder datos críticos, §8 honestidad).
 */
export const TooltipProvider = TooltipPrimitive.Provider;

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}

export function Tooltip({ content, children, side = "top", delayDuration = 200 }: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-[100] max-w-xs rounded-[var(--radius-sm)] bg-[var(--bg-inverse)] px-2.5 py-1.5 text-[13px] font-medium text-[var(--text-inverse)] shadow-md",
            "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-[var(--bg-inverse)]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
