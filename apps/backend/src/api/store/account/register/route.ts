import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { createCustomerAccountWorkflow } from "@medusajs/core-flows";
import { provisionAccount, resolveCustomersByEmail } from "../../../../lib/account-provisioning";
import { StoreAccountRegisterType } from "./validators";

/**
 * `POST /store/account/register` (API.md §17.3, D82) — alta de cuenta que NO duplica
 * clientes. Reemplaza al paso `store.customer.create` del registro nativo (§7.1).
 *
 * Por qué existe: Medusa permite DOS filas de `customer` por correo
 * (`UNIQUE (email, has_account)`) y `validateCustomerAccountCreation` no lanza cuando
 * ya hay un invitado, así que el registro nativo creaba la segunda fila y dejaba la
 * compra del invitado colgando de un `customer_id` que la cuenta nueva no veía.
 *
 * Por qué el orden importa: el registro nativo hace `auth.register` en el navegador
 * ANTES de crear el customer. Si dejáramos ese paso en el front, la identidad nacería
 * con la contraseña que el usuario eligió y podría entrar sin haber demostrado nada.
 * Por eso **el alta de la identidad ocurre aquí, en el servidor**, y solo en el
 * desenlace `created` usa la contraseña del formulario.
 *
 * Tres desenlaces (§17.3):
 *  - `409 already_account` → ya hay cuenta (o identidad reclamada) con ese correo.
 *  - `202 verify_email`    → hay un INVITADO: se le manda el enlace de activación y
 *                            la adopción queda pendiente del clic. No abre sesión.
 *  - `201 created`         → correo limpio: alta nativa completa; el front hace login.
 *
 * ⚠️ Enumeración (decisión explícita, §17.3): `verify_email` revela que ese correo
 * tuvo actividad previa. Está encapsulado aquí a propósito — para volverlo
 * anti-enumeración basta responder `verify_email` también en el caso limpio y mover
 * el alta al clic del enlace, sin tocar el resto del sistema.
 */
export async function POST(
  req: MedusaRequest<StoreAccountRegisterType>,
  res: MedusaResponse,
) {
  const { email, password, first_name, last_name } = req.validatedBody;
  const customerService = req.scope.resolve(Modules.CUSTOMER) as never;
  const authService = req.scope.resolve(Modules.AUTH) as never;

  const { registered, guest } = await resolveCustomersByEmail(customerService, email);

  // (a) Ya hay cuenta → nunca una segunda fila ni una segunda identidad.
  if (registered) {
    res.status(409).json({
      status: "already_account",
      // Cubre a propósito los dos casos —cuenta activa y activación pendiente—
      // porque desde fuera son el mismo consejo: entra o recupera tu contraseña.
      message: "Ya hay una cuenta con ese correo. Inicia sesión o recupera tu contraseña.",
    });
    return;
  }

  // (b) Hay invitado → lógica central compartida con el job (§17.2). Adopta el
  //     `customer_id` existente (cero FKs movidas) y deja el vínculo INERTE hasta
  //     que el cliente use el enlace del correo.
  if (guest) {
    const outcome = await provisionAccount(req.scope, {
      email,
      customerId: guest.id,
      firstName: first_name,
      lastName: last_name,
      trigger: "claim",
    });

    // El correo ganó una cuenta entre la lectura de (a) y ahora (carrera, §17.4):
    // no se crea nada nuevo, se enruta al flujo de cuenta existente.
    if (outcome === "already_account") {
      res.status(409).json({
      status: "already_account",
      // Cubre a propósito los dos casos —cuenta activa y activación pendiente—
      // porque desde fuera son el mismo consejo: entra o recupera tu contraseña.
      message: "Ya hay una cuenta con ese correo. Inicia sesión o recupera tu contraseña.",
    });
      return;
    }
    // `provisioned` y `already_pending` son lo mismo para el cliente: hay un enlace
    // en su correo. En el camino `claim` el token se emite SIEMPRE fresco, porque el
    // anterior (p. ej. el que mandó el job) vence a los 15 minutos.
    res.status(202).json({ status: "verify_email" });
    return;
  }

  // (c) Correo limpio → alta nativa completa, server-side. `createCustomerAccountWorkflow`
  //     marca `has_account` y liga la identidad; el evento `customer.created` dispara
  //     el email de bienvenida de siempre (§11).
  const reg = await (authService as {
    register: (
      p: string,
      d: { body: { email: string; password: string } },
    ) => Promise<{ success: boolean; authIdentity?: { id: string } }>;
  }).register("emailpass", { body: { email, password } });

  // Carrera contra otra alta simultánea con el mismo correo: la UNIQUE de
  // `provider_identity (entity_id, provider)` la resuelve por nosotros.
  if (!reg.success || !reg.authIdentity) {
    res.status(409).json({
      status: "already_account",
      // Cubre a propósito los dos casos —cuenta activa y activación pendiente—
      // porque desde fuera son el mismo consejo: entra o recupera tu contraseña.
      message: "Ya hay una cuenta con ese correo. Inicia sesión o recupera tu contraseña.",
    });
    return;
  }

  const { result: customer } = await createCustomerAccountWorkflow(req.scope).run({
    input: {
      authIdentityId: reg.authIdentity.id,
      customerData: { email, first_name, last_name },
    },
  });

  res.status(201).json({ status: "created", customer });
}
