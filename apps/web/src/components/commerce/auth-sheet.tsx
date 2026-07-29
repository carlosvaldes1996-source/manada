"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { useAuthActions } from "@/hooks";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

type Errors = { firstName?: string; email?: string; password?: string };

export interface AuthSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se llama tras autenticar con éxito (sesión ya iniciada, carrito transferido). */
  onAuthenticated?: () => void;
  title?: string;
  description?: string;
}

/**
 * Modal de identificación en contexto (D59 · gate de suscripción). Suscribir
 * requiere cuenta (no se tokeniza a un invitado): en vez de mandar al usuario a
 * `/ingresar` —que lo hacía caer en el onboarding y perder su carrito—, se
 * resuelve **sin salir del checkout**. Dos modos: Ingresar (cuenta existente) y
 * Crear cuenta (nombre + correo + contraseña, sin re-onboardear la mascota).
 *
 * Reusa `useAuthActions`: login/register ya **transfieren el carrito de invitado**
 * y refrescan la sesión → al volver, `user` se puebla y `needsLogin` se apaga solo,
 * de modo que el checkout continúa el pago sin redirects.
 */
export function AuthSheet({ open, onOpenChange, onAuthenticated, title, description }: AuthSheetProps) {
  const { login, register } = useAuthActions();
  const { toast } = useToast();

  const [tab, setTab] = useState<"login" | "register">("login");
  // El correo/contraseña se comparten entre pestañas (no reescribir al alternar).
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleOpenChange(next: boolean) {
    // Al cerrar, descarta estados transitorios (deja lo tipeado por si reabre).
    if (!next) {
      setLoading(false);
      setFormError(null);
      setErrors({});
    }
    onOpenChange(next);
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setFormError(null);
    const next: Errors = {};
    if (!EMAIL_RE.test(email)) next.email = "Revisa tu correo";
    if (!password) next.password = "Ingresa tu contraseña";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    const { ok, error } = await login(email, password);
    if (ok) {
      toast({ title: "¡Hola de nuevo!", description: "Sesión iniciada.", variant: "success" });
      setLoading(false);
      onAuthenticated?.();
    } else {
      setFormError(error ?? "No pudimos iniciar tu sesión.");
      setLoading(false);
    }
  }

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setFormError(null);
    const next: Errors = {};
    if (!firstName.trim()) next.firstName = "Cuéntanos tu nombre";
    if (!EMAIL_RE.test(email)) next.email = "Revisa tu correo";
    if (password.length < MIN_PASSWORD) next.password = `Mínimo ${MIN_PASSWORD} caracteres`;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    const { ok, error } = await register({ firstName, email, password });
    if (ok) {
      toast({ title: "¡Cuenta creada!", description: "Ya eres parte de la manada.", variant: "success" });
      setLoading(false);
      onAuthenticated?.();
    } else {
      setFormError(error ?? "No pudimos crear tu cuenta.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? "Identifícate para suscribirte"}</DialogTitle>
          <DialogDescription>
            {description ??
              "Guardamos tu plan y tu medio de pago de forma segura. No perderás tu carrito."}
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <Alert variant="error" className="mb-4">
            {formError}
          </Alert>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
          <TabsList>
            <TabsTrigger value="login">Ingresar</TabsTrigger>
            <TabsTrigger value="register">Crear cuenta</TabsTrigger>
          </TabsList>

          {/* Ingresar — cuenta existente */}
          <TabsContent value="login">
            <form className="flex flex-col gap-4" onSubmit={submitLogin} noValidate>
              <Input
                type="email"
                label="Correo"
                placeholder="tucorreo@ejemplo.cl"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                required
              />
              <Input
                type="password"
                label="Contraseña"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
              />
              <Button type="submit" size="lg" block loading={loading}>
                Ingresar y continuar
              </Button>
            </form>
          </TabsContent>

          {/* Crear cuenta — nombre + correo + contraseña (sin re-onboarding) */}
          <TabsContent value="register">
            <form className="flex flex-col gap-4" onSubmit={submitRegister} noValidate>
              <Input
                type="text"
                label="Tu nombre"
                placeholder="Ej: Carla"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={errors.firstName}
                required
              />
              <Input
                type="email"
                label="Correo"
                placeholder="tucorreo@ejemplo.cl"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                required
              />
              <Input
                type="password"
                label="Contraseña"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
              />
              <Button type="submit" size="lg" block loading={loading}>
                Crear cuenta y continuar
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
