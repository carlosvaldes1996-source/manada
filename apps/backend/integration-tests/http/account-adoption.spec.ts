import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { Modules } from "@medusajs/framework/utils";
import { provisionAccount } from "../../src/lib/account-provisioning";

jest.setTimeout(120 * 1000);

/**
 * Adopción invitado → cuenta (API.md §17, D82).
 *
 * Lo que estas pruebas defienden, en orden de prioridad:
 *  1. NUNCA una segunda fila de `customer` para el mismo correo;
 *  2. NUNCA se fusiona ni se reasigna nada: el `customer_id` del invitado sobrevive
 *     intacto, que es lo que mantiene sanos órdenes, suscripciones, mascotas,
 *     direcciones y todo lo de pago;
 *  3. la adopción (`has_account = true`) ocurre SOLO después de demostrar posesión
 *     del correo;
 *  4. las dos carreras (registro↔job) resuelven determinista, en cualquier orden;
 *  5. todo es idempotente.
 *
 * Cómo se simula el clic en el enlace: `auth.updateProvider("emailpass", …)` es
 * exactamente lo que ejecuta la pantalla `/recuperar/nueva` cuando el cliente usa el
 * token. Validar el JWT del token es responsabilidad de Medusa y ya está probado
 * aguas arriba; lo nuestro empieza en "ya tiene contraseña utilizable".
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    const REGISTER = "/store/account/register";
    const CONFIRM = "/store/account/confirm";

    /** Correo único por caso: el runner comparte base entre tests del archivo. */
    let seq = 0;
    const freshEmail = () => `adopcion.${Date.now()}.${seq++}@manada.test`;

    const customerService = () => getContainer().resolve(Modules.CUSTOMER) as never as {
      createCustomers: (d: Record<string, unknown>) => Promise<{ id: string }>;
      listCustomers: (f: Record<string, unknown>) => Promise<
        { id: string; email: string; has_account: boolean; first_name?: string | null }[]
      >;
      retrieveCustomer: (id: string) => Promise<{ id: string; has_account: boolean }>;
    };

    const authService = () => getContainer().resolve(Modules.AUTH) as never as {
      updateProvider: (p: string, d: Record<string, unknown>) => Promise<{ success: boolean }>;
      listAuthIdentities: (f?: Record<string, unknown>) => Promise<
        { id: string; app_metadata?: Record<string, unknown> | null }[]
      >;
    };

    /** Invitado tal como lo crea Medusa al escribir el correo en el checkout. */
    const createGuest = async (email: string) =>
      customerService().createCustomers({ email, has_account: false });

    const rowsFor = (email: string) => customerService().listCustomers({ email });

    /**
     * axios tira un `AxiosError: status 400` pelado y esconde el cuerpo, que es
     * justo donde el backend explica qué pasó. Este envoltorio lo saca a la luz para
     * que un test rojo se lea sin tener que instrumentar nada.
     */
    type ApiResponse = { status: number; data: Record<string, unknown> };
    const post = async (
      path: string,
      body: Record<string, unknown>,
      h: Record<string, string>,
    ): Promise<ApiResponse> => {
      try {
        return (await api.post(path, body, { headers: h })) as ApiResponse;
      } catch (e) {
        const res = (e as { response?: ApiResponse }).response;
        if (!res) throw e;
        // 400/500 inesperados: el motivo va en el cuerpo, no en el status.
        if (res.status >= 400 && res.status !== 409) {
          console.error(`↳ ${path} → ${res.status}`, JSON.stringify(res.data));
        }
        return res;
      }
    };

    /**
     * Publishable key: la Store API la exige en todas las rutas `/store/*`.
     *
     * Va en `beforeEach`, no en `beforeAll`, porque el runner **vacía la base entre
     * tests**: la key del test anterior ya no existe y todas las peticiones caerían
     * con "A valid publishable key is required". El lado bueno de esa limpieza es que
     * cada caso arranca con la tabla `customer` vacía, así que los conteos de filas
     * de más abajo miden exactamente lo que dicen medir.
     */
    let headers: Record<string, string> = {};
    beforeEach(async () => {
      const apiKeyService = getContainer().resolve(Modules.API_KEY) as never as {
        listApiKeys: (f: Record<string, unknown>) => Promise<{ token: string }[]>;
        createApiKeys: (d: Record<string, unknown>) => Promise<{ token: string }>;
      };
      const [existing] = await apiKeyService.listApiKeys({ type: "publishable" });
      const key =
        existing ??
        (await apiKeyService.createApiKeys({
          title: "test",
          type: "publishable",
          created_by: "test",
        }));
      headers = { "x-publishable-api-key": key.token };
    });

    /** Simula el clic en el enlace del correo + el login que viene después. */
    const activateAndLogin = async (email: string, password: string) => {
      const updated = await authService().updateProvider("emailpass", {
        entity_id: email,
        password,
      });
      expect(updated.success).toBe(true);

      const login = await api.post("/auth/customer/emailpass", { email, password });
      expect(login.status).toEqual(200);
      return { Authorization: `Bearer ${login.data.token}`, ...headers };
    };

    describe("§17 · adopción invitado → cuenta", () => {
      it("1 · guest → registro → verificación → adopción (sin duplicar el customer)", async () => {
        const email = freshEmail();
        const guest = await createGuest(email);

        const res = await post(
          REGISTER,
          { email, password: "unaClaveLarga1", first_name: "María" },
          headers,
        );

        expect(res.status).toEqual(202);
        expect(res.data.status).toEqual("verify_email");

        // Invariante #1 y #2: sigue habiendo UNA fila y es la misma de siempre.
        const afterRegister = await rowsFor(email);
        expect(afterRegister).toHaveLength(1);
        expect(afterRegister[0].id).toEqual(guest.id);

        // Invariante #3: todavía NO está adoptado — falta demostrar el correo.
        expect(afterRegister[0].has_account).toBe(false);

        // El nombre del formulario sí se guarda (el invitado nace sin nombre).
        expect(afterRegister[0].first_name).toEqual("María");

        // La identidad quedó ligada al invitado, no a un cliente nuevo.
        const identities = await authService().listAuthIdentities();
        const linked = identities.filter((i) => i.app_metadata?.customer_id === guest.id);
        expect(linked).toHaveLength(1);

        // Clic en el enlace → sesión → la adopción se consuma.
        const auth = await activateAndLogin(email, "otraClaveLarga2");
        const confirm = await post(CONFIRM, {}, auth);
        expect(confirm.status).toEqual(200);
        expect(confirm.data.activated).toBe(true);

        const adopted = await rowsFor(email);
        expect(adopted).toHaveLength(1);
        expect(adopted[0].id).toEqual(guest.id); // ← el mismo customer_id de la compra
        expect(adopted[0].has_account).toBe(true);
      });

      it("2 · guest → AUTO_ACCOUNT (job) → cuenta, sobre el MISMO customer", async () => {
        const email = freshEmail();
        const guest = await createGuest(email);

        const outcome = await provisionAccount(getContainer(), {
          email,
          customerId: guest.id,
          firstName: "Benito",
          trigger: "job",
        });
        expect(outcome).toEqual("provisioned");

        // El job tampoco adopta por su cuenta: manda el correo y espera el clic.
        const pending = await rowsFor(email);
        expect(pending).toHaveLength(1);
        expect(pending[0].has_account).toBe(false);

        const auth = await activateAndLogin(email, "claveDelCorreo3");
        const confirm = await post(CONFIRM, {}, auth);
        expect(confirm.data.activated).toBe(true);

        const adopted = await rowsFor(email);
        expect(adopted).toHaveLength(1);
        expect(adopted[0].id).toEqual(guest.id);
        expect(adopted[0].has_account).toBe(true);
      });

      it("3 · registro ANTES del job → el job no hace nada", async () => {
        const email = freshEmail();
        const guest = await createGuest(email);

        const res = await post(
          REGISTER,
          { email, password: "unaClaveLarga1", first_name: "Ana" },
          headers,
        );
        expect(res.data.status).toEqual("verify_email");

        // El job llega después: la identidad ya está ligada → no reenvía nada.
        const outcome = await provisionAccount(getContainer(), {
          email,
          customerId: guest.id,
          trigger: "job",
        });
        expect(outcome).toEqual("already_pending");
        expect(await rowsFor(email)).toHaveLength(1);

        // Y una vez activado, el job lo ve como cuenta y sale antes.
        const auth = await activateAndLogin(email, "claveDefinitiva4");
        await post(CONFIRM, {}, auth);

        const after = await provisionAccount(getContainer(), {
          email,
          customerId: guest.id,
          trigger: "job",
        });
        expect(after).toEqual("already_account");
        expect(await rowsFor(email)).toHaveLength(1);
      });

      it("4 · job ANTES del registro → no crea otra identity ni otro customer", async () => {
        const email = freshEmail();
        const guest = await createGuest(email);

        expect(
          await provisionAccount(getContainer(), {
            email,
            customerId: guest.id,
            trigger: "job",
          }),
        ).toEqual("provisioned");

        // El cliente intenta registrarse después. Se le vuelve a emitir enlace
        // (el del job vence a los 15 min) pero NO nace nada nuevo.
        const res = await post(
          REGISTER,
          { email, password: "unaClaveLarga1", first_name: "Ana" },
          headers,
        );
        expect(res.status).toEqual(202);
        expect(res.data.status).toEqual("verify_email");

        expect(await rowsFor(email)).toHaveLength(1);
        const identities = await authService().listAuthIdentities();
        expect(identities.filter((i) => i.app_metadata?.customer_id === guest.id)).toHaveLength(1);
      });

      it("5 · provisioning dos veces seguidas → idempotente", async () => {
        const email = freshEmail();
        const guest = await createGuest(email);
        const args = { email, customerId: guest.id, trigger: "job" as const };

        expect(await provisionAccount(getContainer(), args)).toEqual("provisioned");
        expect(await provisionAccount(getContainer(), args)).toEqual("already_pending");
        expect(await provisionAccount(getContainer(), args)).toEqual("already_pending");

        expect(await rowsFor(email)).toHaveLength(1);
        const identities = await authService().listAuthIdentities();
        expect(identities.filter((i) => i.app_metadata?.customer_id === guest.id)).toHaveLength(1);
      });

      it("6 · guest CON orden pagada → la orden sigue colgando del mismo customer", async () => {
        const email = freshEmail();
        const guest = await createGuest(email);

        const orderService = getContainer().resolve(Modules.ORDER) as never as {
          createOrders: (d: Record<string, unknown>) => Promise<{ id: string }>;
          listOrders: (f: Record<string, unknown>) => Promise<{ id: string; customer_id: string }[]>;
        };
        const order = await orderService.createOrders({
          email,
          customer_id: guest.id,
          currency_code: "clp",
        });

        const res = await post(
          REGISTER,
          { email, password: "unaClaveLarga1", first_name: "Carla" },
          headers,
        );
        expect(res.data.status).toEqual("verify_email");

        const auth = await activateAndLogin(email, "claveDelCorreo5");
        expect((await post(CONFIRM, {}, auth)).data.activated).toBe(true);

        // El punto entero del ejercicio: la compra quedó dentro de la cuenta, y por
        // adopción —el `customer_id` de la orden NUNCA se tocó—, no por migración.
        const orders = await orderService.listOrders({ id: order.id });
        expect(orders[0].customer_id).toEqual(guest.id);

        const rows = await rowsFor(email);
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toEqual(guest.id);
        expect(rows[0].has_account).toBe(true);
      });

      it("7 · guest SIN orden pagada → mismo camino, sin depender de que exista compra", async () => {
        const email = freshEmail();
        const guest = await createGuest(email);

        const res = await post(
          REGISTER,
          { email, password: "unaClaveLarga1", first_name: "Sofía" },
          headers,
        );
        expect(res.status).toEqual(202);

        const auth = await activateAndLogin(email, "claveDelCorreo6");
        expect((await post(CONFIRM, {}, auth)).data.activated).toBe(true);

        const rows = await rowsFor(email);
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toEqual(guest.id);
      });

      it("8 · correo LIMPIO → alta directa con sesión, sin pasar por activación", async () => {
        const email = freshEmail();

        const res = await post(
          REGISTER,
          { email, password: "unaClaveLarga1", first_name: "Nueva" },
          headers,
        );
        expect(res.status).toEqual(201);
        expect(res.data.status).toEqual("created");

        const rows = await rowsFor(email);
        expect(rows).toHaveLength(1);
        expect(rows[0].has_account).toBe(true);

        // Reintentar con el mismo correo ya no puede crear una segunda fila.
        const again = await post(REGISTER, { email, password: "unaClaveLarga1", first_name: "Otra" }, headers);
        expect(again.status).toEqual(409);
        expect(again.data.status).toEqual("already_account");
        expect(await rowsFor(email)).toHaveLength(1);
      });

      it("9 · par invitado+registrado preexistente → 409 limpio, sin violar la UNIQUE", async () => {
        // Deuda anterior a D82 (API.md §17.6): las dos filas coexisten. El endpoint
        // no debe intentar marcar al invitado —reventaría (email, has_account)—.
        const email = freshEmail();
        const guest = await createGuest(email);
        await customerService().createCustomers({ email, has_account: true });

        const res = await post(REGISTER, { email, password: "unaClaveLarga1", first_name: "Dup" }, headers);

        expect(res.status).toEqual(409);
        expect(res.data.status).toEqual("already_account");
        expect(await rowsFor(email)).toHaveLength(2); // no empeora, tampoco explota

        // Y el job tampoco toca ese par.
        expect(
          await provisionAccount(getContainer(), { email, customerId: guest.id, trigger: "job" }),
        ).toEqual("already_account");
      });

      it("10 · confirm es idempotente: solo el PRIMER login devuelve activated", async () => {
        const email = freshEmail();
        await createGuest(email);
        await post(
          REGISTER,
          { email, password: "unaClaveLarga1", first_name: "Idem" },
          headers,
        );

        const auth = await activateAndLogin(email, "claveDelCorreo7");
        expect((await post(CONFIRM, {}, auth)).data.activated).toBe(true);
        // Segundo, tercer… login: no-op. Esto es lo que impide que la mascota del
        // onboarding se vuelva a transferir (§17.5).
        expect((await post(CONFIRM, {}, auth)).data.activated).toBe(false);
        expect((await post(CONFIRM, {}, auth)).data.activated).toBe(false);
      });
    });
  },
});
