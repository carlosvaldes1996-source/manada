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

/**
 * Registro nativo en tres pasos (patrón oficial de Medusa v2):
 * 1) identidad + clave (`auth.register`) — el SDK guarda el token,
 * 2) crear y ligar el customer (`store.customer.create`) con ese token,
 * 3) `auth.login` → token de sesión definitivo (ya con `customer_id`).
 *
 * Blindado contra identidades "huérfanas" (D: bug de recuperar contraseña): cada
 * paso es idempotente, así que un intento previo a medias (identidad creada pero
 * sin customer ligado) se **completa** en el siguiente registro en vez de quedar
 * roto para siempre:
 * - Si `auth.register` falla porque la identidad ya existe, caemos a `auth.login`
 *   con la clave dada: si coincide es el mismo dueño y recuperamos la sesión; si
 *   no, el error propaga (correo en uso → lo traduce `useAuthActions`).
 * - Si `store.customer.create` rechaza porque la identidad ya estaba ligada,
 *   recuperamos el customer existente. Nunca dejamos la identidad sin cliente.
 */
export async function registerCustomer(input: RegisterInput): Promise<User> {
  const email = input.email.trim().toLowerCase();
  const { password } = input;

  try {
    await medusa.auth.register(CUSTOMER, EMAILPASS, { email, password });
  } catch {
    // Identidad ya existente (p. ej. un registro previo que no ligó el customer):
    // reautentica. Si la clave no coincide, el login lanza y propaga el error.
    await medusa.auth.login(CUSTOMER, EMAILPASS, { email, password });
  }

  let user: User | null = null;
  try {
    const { customer } = await medusa.store.customer.create({
      email,
      first_name: input.firstName.trim(),
      last_name: input.lastName?.trim() || undefined,
    });
    user = mapCustomer(customer);
  } catch {
    // La identidad ya estaba ligada a un customer (reintento): lo recuperamos abajo.
  }

  // Token de sesión definitivo (ya con `customer_id` ligado).
  await medusa.auth.login(CUSTOMER, EMAILPASS, { email, password });
  user ??= await getCurrentCustomer();
  if (!user) throw new Error("No pudimos crear tu cuenta.");
  return user;
}

/** Login nativo (emailpass). Sin MFA/terceros en el MVP. */
export async function loginCustomer(email: string, password: string): Promise<User> {
  const normalized = email.trim().toLowerCase();
  const result = await medusa.auth.login(CUSTOMER, EMAILPASS, {
    email: normalized,
    password,
  });
  if (typeof result !== "string") {
    // Respuesta de redirección/MFA — no aplica al MVP emailpass.
    throw new Error("Este método de ingreso no está disponible.");
  }
  let user = await getCurrentCustomer();
  if (!user) {
    // Autenticado pero sin `customer` ligado: identidad "huérfana" (p. ej. un
    // registro que falló tras `auth.register`, o un reset de contraseña sobre una
    // identidad que nunca se ligó a un cliente). El token vale pero no trae
    // `actor_id`, así que `customer.retrieve()` da 401. Ya tenemos sesión válida →
    // creamos y ligamos el customer ahora (mismo paso que el registro) para
    // auto-reparar la cuenta en vez de dejar al cliente fuera para siempre.
    user = await healOrphanIdentity(normalized);
  }
  if (!user) throw new Error("No se pudo cargar tu cuenta.");
  return user;
}

/**
 * Repara una identidad autenticada sin `customer` ligado creando el cliente con
 * el token de sesión (que aún no trae `actor_id`, igual que el token de registro).
 * `store.customer.create` liga la identidad al nuevo customer. Devuelve `null` si
 * no se pudo (p. ej. el fallo original era transitorio y la identidad sí estaba
 * ligada → `create` rechaza con "already authenticated as a customer").
 */
async function healOrphanIdentity(email: string): Promise<User | null> {
  try {
    const { customer } = await medusa.store.customer.create({ email });
    return mapCustomer(customer);
  } catch {
    return null;
  }
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
