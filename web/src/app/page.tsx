"use client";

import { useSession } from "@/components/providers";
import { LandingView } from "./landing-view";
import { DashboardView } from "./dashboard-view";

/**
 * Home según el estado de sesión (Fase 3.3B · resuelve la "doble identidad",
 * AUDIT_UI_UX U041/U058):
 * - Visitante anónimo → <LandingView> (landing de marca, embudo de activación).
 * - Con sesión iniciada → <DashboardView> (la "app" personal: Carlos + Toby).
 *
 * Una sola superficie en `/`, sin mezclar modelos mentales.
 */
export default function HomePage() {
  const { status } = useSession();
  return status === "authenticated" ? <DashboardView /> : <LandingView />;
}
