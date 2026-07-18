import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * Reseteo de la contraseña de un usuario Admin existente.
 *
 * El comando `medusa user -e ... -p ...` CREA un usuario (via
 * `create-users-workflow`) y falla si el email ya existe → no sirve para
 * resetear. La contraseña vive en el módulo Auth como una `provider_identity`
 * del proveedor `emailpass`; para cambiarla se usa `authModuleService.updateProvider`,
 * que reescribe el hash scrypt de esa identidad.
 *
 * No hardcodea la clave: se lee de env vars.
 *   ADMIN_EMAIL          (opcional, default: carlosvaldes1996@gmail.com)
 *   NEW_ADMIN_PASSWORD   (requerida)
 *
 * Ejecutar dentro del contenedor de Railway (donde vive la DB de prod):
 *   ADMIN_EMAIL=carlosvaldes1996@gmail.com NEW_ADMIN_PASSWORD='...' \
 *     npx medusa exec ./src/scripts/reset-admin-password.ts
 */
export default async function resetAdminPassword({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const auth = container.resolve(Modules.AUTH);

  const email = (process.env.ADMIN_EMAIL ?? "carlosvaldes1996@gmail.com").trim();
  const password = process.env.NEW_ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    logger.error(
      "[reset-admin] Falta NEW_ADMIN_PASSWORD (o es < 8 caracteres). " +
        "Ejecuta: NEW_ADMIN_PASSWORD='tu-clave' npx medusa exec ./src/scripts/reset-admin-password.ts",
    );
    process.exit(1);
  }

  const { success, error } = await auth.updateProvider("emailpass", {
    entity_id: email,
    password,
  });

  if (!success) {
    logger.error(
      `[reset-admin] No se pudo actualizar la contraseña de ${email}: ${error}. ` +
        "Verifica que el email exista como usuario Admin (proveedor emailpass).",
    );
    process.exit(1);
  }

  logger.info(
    `[reset-admin] ✅ Contraseña actualizada para ${email}. ` +
      "Ya puedes entrar en /app con la nueva clave.",
  );
}
