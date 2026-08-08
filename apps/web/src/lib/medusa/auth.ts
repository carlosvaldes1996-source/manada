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
  const rut = typeof customer.metadata?.rut === "string" ? customer.metadata.rut : undefined;
  return {
    id: customer.id,
    firstName,
    lastName: customer.last_name ?? undefined,
    email: customer.email,
    rut,
  };
}

/**
 * Guarda el RUT en el cliente (`metadata.rut`) para prellenarlo en futuras
 * compras. Best-effort desde el checkout: el llamador la usa sin bloquear la orden.
 */
export async function saveCustomerRut(rut: string): Promise<void> {
  await medusa.store.customer.update({ metadata: { rut } });
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

/** Desenlaces del alta (API.md §17.3). */
export type RegisterOutcome =
  /** Correo limpio: cuenta creada y sesión abierta. */
  | "created"
  /** Había un invitado con ese correo: se envió el enlace de activación, sin sesión. */
  | "verify_email";

/**
 * Alta de cuenta vía `POST /store/account/register` (API.md §17.3, D82).
 *
 * Ya NO se usa el trío nativo `auth.register` → `store.customer.create` → `auth.login`:
 * Medusa admite DOS filas de `customer` por correo (`UNIQUE (email, has_account)`) y
 * ese camino creaba la segunda cuando ya existía un invitado, dejando su compra,
 * suscripción y mascotas colgando de un cliente que la cuenta nueva nunca veía.
 *
 * El paso que se mueve al servidor es `auth.register`: si la identidad naciera aquí
 * con la contraseña elegida, quien tuviera un invitado con ese correo podría entrar
 * sin demostrar que la casilla es suya. Ahora el backend decide, y solo en el caso
 * `created` hay contraseña utilizable y login inmediato.
 *
 * Lanza en 409 (correo con cuenta) — el mensaje ya viene listo para la UI.
 */
export async function registerCustomer(input: RegisterInput): Promise<RegisterOutcome> {
  const email = input.email.trim().toLowerCase();
  const { status } = await medusa.client.fetch<{ status: RegisterOutcome }>(
    "/store/account/register",
    {
      method: "POST",
      body: {
        email,
        password: input.password,
        first_name: input.firstName.trim(),
        last_name: input.lastName?.trim() || undefined,
      },
    },
  );

  // `verify_email` = la adopción del invitado queda pendiente del clic en el correo.
  if (status === "verify_email") return "verify_email";

  await medusa.auth.login(CUSTOMER, EMAILPASS, { email, password: input.password });
  return "created";
}

/**
 * Consuma la adopción invitado→cuenta (API.md §17.2). Se llama tras CADA login: es
 * el backend —no el navegador— quien sabe si esta es la primera sesión después de
 * una activación, y solo puede decirlo una vez (al marcar `has_account` la condición
 * se apaga sola). Devuelve `true` únicamente en ese primer login.
 *
 * Nunca propaga: si falla, la sesión ya es válida y el único costo es no adoptar la
 * mascota del onboarding en este intento.
 */
export async function confirmAccount(): Promise<boolean> {
  try {
    const { activated } = await medusa.client.fetch<{ activated: boolean }>(
      "/store/account/confirm",
      { method: "POST" },
    );
    return Boolean(activated);
  } catch {
    return false;
  }
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
