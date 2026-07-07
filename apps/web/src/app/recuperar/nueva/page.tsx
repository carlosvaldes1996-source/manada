import { ResetPasswordView } from "./reset-view";

/**
 * Recuperar contraseña — paso 2: fijar la nueva (Fase 5 · Etapa A). El `token`
 * (y el `email`) llegan por query desde el enlace de recuperación; se leen en el
 * server y se pasan como props (evita `useSearchParams` + Suspense).
 */
export default async function NuevaPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;
  return <ResetPasswordView token={token ?? ""} email={email ?? ""} />;
}
