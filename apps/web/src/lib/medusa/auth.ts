import type { HttpTypes } from "@medusajs/types";
import type { User } from "@/types";
import { medusa } from "./client";

/**
 * Autenticación de clientes sobre el Auth + Customer Module de Medusa
 * (Fase 5 · Etapa A). Todo NATIVO: `sdk.auth.*` (emailpass) + `sdk.store.customer.*`.
 * El SDK persiste el JWT en localStorage (ver client.ts) → sesión persistente.
 *
 * Este módulo solo habla con la Store API; la coordinación con el carrito
 * (transferencia invitado→cliente) y las mascotas vive en `useAuthActions`.
 */

const CUSTOMER = "customer";
const EMAILPASS = "emailpass";

/** Customer de Medusa → `User` del dominio Manada (nombre visible + correo). */
export function mapCustomer(customer: HttpTypes.StoreCustomer): User {
  const firstName = customer.first_name?.trim() || customer.email.split("@")[0];
  return {
    id: customer.id,
    firstName,
    lastName: customer.last_name ?? undefined,
    email: customer.email,
  };
}

/** Cliente autenticado actual, o `null` si no hay sesión válida (token ausente/expirado). */
export async function getCurrentCustomer(): Promise<User | null> {
  try {
    const { customer } = await medusa.store.customer.retrieve();
    return mapCustomer(customer);
  } catch {
    return null;
  }
}

export interface RegisterInput {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
}

/**
 * Registro nativo en tres pasos (patrón oficial de Medusa v2):
 * 1) token de registro (`auth.register`) — el SDK lo guarda,
 * 2) crear el customer (`store.customer.create`) con ese token,
 * 3) `auth.login` → token de sesión definitivo (ya con `customer_id`).
 * Lanza si el correo ya existe (lo traduce `useAuthActions`).
 */
export async function registerCustomer(input: RegisterInput): Promise<User> {
  const email = input.email.trim().toLowerCase();
  await medusa.auth.register(CUSTOMER, EMAILPASS, { email, password: input.password });
  const { customer } = await medusa.store.customer.create({
    email,
    first_name: input.firstName.trim(),
    last_name: input.lastName?.trim() || undefined,
  });
  await medusa.auth.login(CUSTOMER, EMAILPASS, { email, password: input.password });
  return mapCustomer(customer);
}

/** Login nativo (emailpass). Sin MFA/terceros en el MVP. */
export async function loginCustomer(email: string, password: string): Promise<User> {
  const result = await medusa.auth.login(CUSTOMER, EMAILPASS, {
    email: email.trim().toLowerCase(),
    password,
  });
  if (typeof result !== "string") {
    // Respuesta de redirección/MFA — no aplica al MVP emailpass.
    throw new Error("Este método de ingreso no está disponible.");
  }
  const user = await getCurrentCustomer();
  if (!user) throw new Error("No se pudo cargar tu cuenta.");
  return user;
}

/** Cierra la sesión (limpia el token del SDK). */
export async function logoutCustomer(): Promise<void> {
  await medusa.auth.logout();
}

/**
 * Solicita el token de recuperación (`auth.resetPassword`). Medusa emite el evento
 * `auth.password_reset`; la entrega la resuelve un subscriber del backend (hoy
 * loguea el enlace en dev; email transaccional en prod). Siempre resuelve sin
 * revelar si el correo existe (anti-enumeración).
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await medusa.auth.resetPassword(CUSTOMER, EMAILPASS, {
    identifier: email.trim().toLowerCase(),
  });
}

/** Fija la nueva contraseña con el token del enlace de recuperación (`auth.updateProvider`). */
export async function resetPassword(token: string, password: string): Promise<void> {
  await medusa.auth.updateProvider(CUSTOMER, EMAILPASS, { password }, token);
}
