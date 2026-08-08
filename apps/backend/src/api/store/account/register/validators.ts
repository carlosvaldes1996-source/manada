import { z } from "@medusajs/deps/zod";

/**
 * Validación de borde para `POST /store/account/register` (API.md §17.3). Misma
 * instancia de zod que centraliza Medusa en `@medusajs/deps` (igual que §9).
 *
 * `password` se exige aquí aunque en el camino `verify_email` se DESCARTE: el
 * formulario es el mismo para los tres desenlaces y el cliente no sabe —ni debe
 * saber antes de enviar— cuál le va a tocar.
 */
export const StoreAccountRegister = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(8).max(256),
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80).optional(),
});
export type StoreAccountRegisterType = z.infer<typeof StoreAccountRegister>;
