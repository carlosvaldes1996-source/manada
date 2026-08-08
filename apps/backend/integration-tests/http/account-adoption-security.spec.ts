import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { Modules } from "@medusajs/framework/utils";
import { provisionAccount } from "../../src/lib/account-provisioning";

jest.setTimeout(120 * 1000);

/**
 * Superficie de seguridad de la adopción invitado → cuenta (API.md §17, D82).
 *
 * El diseño concentra TODO el riesgo en un punto: entre que `provisionAccount` liga
 * la identidad emailpass al invitado y que el cliente usa el enlace del correo, existe
 * una identidad que apunta a datos reales (órdenes, direcciones, tarjeta) y que todavía
 * no le pertenece a nadie. Estas pruebas atacan justamente ese punto:
 *
 *  · nadie puede autenticarse con esa identidad antes de usar el enlace;
 *  · el único camino de "invitado" a "cuenta" es `POST /store/account/confirm`;
 *  · el token de activación vence, es de un solo uso, está atado a UN correo y no
 *    carga nada sensible.
 *
 * No prueban que Medusa esté bien hecho: prueban que NUESTRO uso de Medusa no abre
 * un agujero. Por eso los casos son intentos de ataque, no caminos felices.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    const REGISTER = "/store/account/register";
    const CONFIRM = "/store/account/confirm";
    const UPDATE = "/auth/customer/emailpass/update";
    const LOGIN = "/auth/customer/emailpass";

    let seq = 0;
    const freshEmail = () => `seg.${Date.now()}.${seq++}@manada.test`;

    type ApiResponse = { status: number; data: Record<string, unknown> };
    const call = async (
      fn: () => Promise<unknown>,
    ): Promise<ApiResponse> => {
      try {
        return (await fn()) as ApiResponse;
      } catch (e) {
        const res = (e as { response?: ApiResponse }).response;
        if (!res) throw e;
        return res;
      }
    };

    const customerService = () => getContainer().resolve(Modules.CUSTOMER) as never as {
      createCustomers: (d: Record<string, unknown>) => Promise<{ id: string }>;
      listCustomers: (f: Record<string, unknown>) => Promise<
        { id: string; has_account: boolean }[]
      >;
    };
    const authService = () => getContainer().resolve(Modules.AUTH) as never as {
      listProviderIdentities: (
        f: Record<string, unknown>,
        c?: Record<string, unknown>,
      ) => Promise<{ entity_id: string; provider_metadata?: Record<string, unknown> }[]>;
    };

    const createGuest = (email: string) =>
      customerService().createCustomers({ email, has_account: false });

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

    /**
     * Captura el token real que viaja en el correo, escuchando el evento nativo
     * `auth.password_reset` — el mismo del que vive `subscribers/password-reset.ts`.
     * Es la única forma honesta de probar el token: fabricar uno a mano probaría
     * nuestro fabricante, no el enlace que recibe el cliente.
     */
    const captureToken = async (trigger: () => Promise<unknown>): Promise<string> => {
      const eventBus = getContainer().resolve(Modules.EVENT_BUS) as never as {
        subscribe: (e: string, s: (d: unknown) => void, c?: Record<string, unknown>) => void;
        unsubscribe: (e: string, s: (d: unknown) => void, c?: Record<string, unknown>) => void;
      };
      let captured: string | undefined;
      const handler = (payload: unknown) => {
        const data = (payload as { data?: { token?: string } })?.data;
        if (data?.token) captured = data.token;
      };
      const ctx = { subscriberId: `test-${Math.random()}` };
      eventBus.subscribe("auth.password_reset", handler, ctx);
      try {
        await trigger();
        // El bus local es asíncrono: se le da una vuelta al event loop.
        for (let i = 0; i < 40 && !captured; i++) {
          await new Promise((r) => setTimeout(r, 50));
        }
      } finally {
        eventBus.unsubscribe("auth.password_reset", handler, ctx);
      }
      if (!captured) throw new Error("No se capturó el token de activación");
      return captured;
    };

    const decode = (jwt: string) =>
      JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString()) as Record<string, unknown>;

    describe("§17 · seguridad de la identidad inerte", () => {
      it("S1 · la contraseña del formulario NO sirve para entrar mientras la activación está pendiente", async () => {
        const email = freshEmail();
        await createGuest(email);
        const formPassword = "laClaveQueEscribio1";

        const res = await call(() =>
          api.post(REGISTER, { email, password: formPassword, first_name: "Ana" }, { headers }),
        );
        expect(res.data.status).toEqual("verify_email");

        // El backend DESCARTA esa contraseña: la identidad nace con una aleatoria.
        const login = await call(() => api.post(LOGIN, { email, password: formPassword }));
        expect(login.status).toEqual(401);

        // Y sigue sin ser cuenta.
        const [row] = await customerService().listCustomers({ email });
        expect(row.has_account).toBe(false);
      });

      it("S2 · la contraseña guardada es aleatoria y de alta entropía, y no se devuelve nunca", async () => {
        const email = freshEmail();
        const guest = await createGuest(email);
        const res = await call(() =>
          api.post(REGISTER, { email, password: "laClaveQueEscribio1", first_name: "Ana" }, { headers }),
        );

        // La respuesta no filtra nada del vínculo recién creado.
        expect(JSON.stringify(res.data)).not.toContain(guest.id);
        expect(Object.keys(res.data)).toEqual(["status"]);

        const [identity] = await authService().listProviderIdentities(
          { entity_id: email, provider: "emailpass" },
          { select: ["entity_id", "provider_metadata"] },
        );
        const stored = identity.provider_metadata?.password as string;
        expect(typeof stored).toEqual("string");
        // scrypt, no la clave en claro ni nada derivable de lo que escribió el usuario.
        expect(stored).not.toContain("laClaveQueEscribio1");
        expect(stored.length).toBeGreaterThan(40);
      });

      it("S3 · `confirm` exige sesión: sin token no adopta a nadie", async () => {
        const email = freshEmail();
        await createGuest(email);
        await call(() =>
          api.post(REGISTER, { email, password: "unaClaveLarga1", first_name: "Ana" }, { headers }),
        );

        const anon = await call(() => api.post(CONFIRM, {}, { headers }));
        expect(anon.status).toEqual(401);

        const [row] = await customerService().listCustomers({ email });
        expect(row.has_account).toBe(false);
      });

      it("S4 · nadie puede RECLAMAR la identidad pendiente con el registro nativo de Medusa", async () => {
        // El ataque: el provider emailpass PISA la contraseña si la identidad todavía
        // no tiene dueño (`app_metadata` vacío). `provisionAccount` liga el
        // `customer_id` en el acto justamente para cerrar esa puerta.
        const email = freshEmail();
        const guest = await createGuest(email);
        await call(() =>
          api.post(REGISTER, { email, password: "unaClaveLarga1", first_name: "Ana" }, { headers }),
        );

        const attack = await call(() =>
          api.post("/auth/customer/emailpass/register", {
            email,
            password: "laClaveDelAtacante9",
          }),
        );
        expect(attack.status).toBeGreaterThanOrEqual(400);

        // Y esa contraseña tampoco abre sesión.
        const login = await call(() =>
          api.post(LOGIN, { email, password: "laClaveDelAtacante9" }),
        );
        expect(login.status).toEqual(401);

        const rows = await customerService().listCustomers({ email });
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toEqual(guest.id);
        expect(rows[0].has_account).toBe(false);
      });

      it("S5 · el token de activación vence a los 15 min, va atado (jti) y no carga nada sensible", async () => {
        const email = freshEmail();
        const guest = await createGuest(email);

        const token = await captureToken(() =>
          provisionAccount(getContainer(), {
            email,
            customerId: guest.id,
            firstName: "Ana",
            trigger: "job",
          }),
        );

        const claims = decode(token);
        expect(claims.exp as number).toEqual((claims.iat as number) + 15 * 60);
        expect(claims.purpose).toEqual("reset"); // la ruta de update rechaza otros
        expect(claims.jti).toBeTruthy(); // sin jti no es de un solo uso
        expect(claims.entity_id).toEqual(email);

        // Lo único identificable es el correo, que ya es del destinatario. Nada de
        // `customer_id`, contraseñas ni datos del pedido.
        expect(Object.keys(claims).sort()).toEqual(
          ["actor_type", "entity_id", "exp", "iat", "jti", "provider", "purpose"].sort(),
        );
      });

      it("S6 · el token es de UN SOLO USO: el segundo intento se rechaza", async () => {
        const email = freshEmail();
        const guest = await createGuest(email);
        const token = await captureToken(() =>
          provisionAccount(getContainer(), { email, customerId: guest.id, trigger: "job" }),
        );
        const auth = { Authorization: `Bearer ${token}` };

        const first = await call(() => api.post(UPDATE, { password: "claveNueva123" }, { headers: auth }));
        expect(first.status).toEqual(200);

        const second = await call(() => api.post(UPDATE, { password: "otraClave456" }, { headers: auth }));
        expect(second.status).toEqual(401);

        // Y la 2ª contraseña no quedó puesta.
        const login = await call(() => api.post(LOGIN, { email, password: "otraClave456" }));
        expect(login.status).toEqual(401);
      });

      it("S7 · el token de un correo NO puede activar otro: el cuerpo no manda", async () => {
        const victimEmail = freshEmail();
        const attackerEmail = freshEmail();
        const victim = await createGuest(victimEmail);
        const attacker = await createGuest(attackerEmail);

        // El atacante consigue un token legítimo... de SU propio correo.
        const token = await captureToken(() =>
          provisionAccount(getContainer(), {
            email: attackerEmail,
            customerId: attacker.id,
            trigger: "job",
          }),
        );
        // Y deja una activación pendiente en el correo de la víctima.
        await provisionAccount(getContainer(), {
          email: victimEmail,
          customerId: victim.id,
          trigger: "job",
        });

        // Intenta fijar la contraseña de la víctima pasándola en el body.
        await call(() =>
          api.post(
            UPDATE,
            { password: "claveDelAtacante7", entity_id: victimEmail, email: victimEmail },
            { headers: { Authorization: `Bearer ${token}` } },
          ),
        );

        // La ruta usa el `entity_id` del TOKEN, no el del cuerpo.
        const intoVictim = await call(() =>
          api.post(LOGIN, { email: victimEmail, password: "claveDelAtacante7" }),
        );
        expect(intoVictim.status).toEqual(401);

        const [victimRow] = await customerService().listCustomers({ email: victimEmail });
        expect(victimRow.has_account).toBe(false);
      });

      it("S8 · consumido el enlace y adoptada la cuenta, el token viejo ya no revive nada", async () => {
        const email = freshEmail();
        const guest = await createGuest(email);
        const token = await captureToken(() =>
          provisionAccount(getContainer(), { email, customerId: guest.id, trigger: "job" }),
        );
        const tokenAuth = { Authorization: `Bearer ${token}` };

        expect(
          (await call(() => api.post(UPDATE, { password: "claveNueva123" }, { headers: tokenAuth })))
            .status,
        ).toEqual(200);

        const login = await call(() => api.post(LOGIN, { email, password: "claveNueva123" }));
        const session = { Authorization: `Bearer ${login.data.token}`, ...headers };
        expect((await call(() => api.post(CONFIRM, {}, { headers: session }))).data.activated).toBe(
          true,
        );

        // Token quemado: no sirve para volver a fijar contraseña…
        expect(
          (await call(() => api.post(UPDATE, { password: "secuestro999" }, { headers: tokenAuth })))
            .status,
        ).toEqual(401);
        expect((await call(() => api.post(LOGIN, { email, password: "secuestro999" }))).status).toEqual(
          401,
        );

        // …ni para "reactivar": `confirm` ya es no-op y el customer es el mismo.
        expect((await call(() => api.post(CONFIRM, {}, { headers: session }))).data.activated).toBe(
          false,
        );
        const rows = await customerService().listCustomers({ email });
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toEqual(guest.id);
      });

      it("S9 · un token de SESIÓN no sirve como token de activación", async () => {
        const email = freshEmail();
        const guest = await createGuest(email);
        const token = await captureToken(() =>
          provisionAccount(getContainer(), { email, customerId: guest.id, trigger: "job" }),
        );
        await call(() => api.post(UPDATE, { password: "claveNueva123" }, { headers: tokenHeaders(token) }));
        const login = await call(() => api.post(LOGIN, { email, password: "claveNueva123" }));

        // El JWT de sesión no lleva `purpose: "reset"` ni `jti` → la ruta lo rechaza.
        const reuse = await call(() =>
          api.post(UPDATE, { password: "otraMas123" }, { headers: tokenHeaders(login.data.token as string) }),
        );
        expect(reuse.status).toEqual(401);
      });

      it("S10 · la ruta NATIVA /store/customers ya no puede crear la 2ª fila (invitado)", async () => {
        // Sin el guard esto devolvía 200 y dejaba DOS clientes con el mismo correo:
        // el dueño real se quedaba sin poder adoptar su compra nunca más, y el par
        // reinstalaba la ambigüedad de `findOrCreateCustomerStep` (§17.6).
        const email = freshEmail();
        const guest = await createGuest(email);

        const reg = await call(() =>
          api.post("/auth/customer/emailpass/register", { email, password: "atacante12345" }),
        );
        const asToken = {
          Authorization: `Bearer ${(reg.data as { token: string }).token}`,
          ...headers,
        };

        const res = await call(() =>
          api.post("/store/customers", { email, first_name: "Atacante" }, { headers: asToken }),
        );
        expect(res.status).toEqual(409);

        const rows = await customerService().listCustomers({ email });
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toEqual(guest.id);
        expect(rows[0].has_account).toBe(false);
      });

      it("S11 · el guard no rompe el alta legítima: correo limpio pasa por la ruta nativa", async () => {
        const email = freshEmail();
        const reg = await call(() =>
          api.post("/auth/customer/emailpass/register", { email, password: "unaClaveLarga1" }),
        );
        const asToken = {
          Authorization: `Bearer ${(reg.data as { token: string }).token}`,
          ...headers,
        };

        const res = await call(() =>
          api.post("/store/customers", { email, first_name: "Legítima" }, { headers: asToken }),
        );
        expect(res.status).toEqual(200);
        expect(await customerService().listCustomers({ email })).toHaveLength(1);
      });

      it("S12 · tras provisionar, la clave almacenada es la que reescribimos al final (ventana TOCTOU cerrada)", async () => {
        // Modela el resultado del ataque de carrera: alguien logra dejar SU hash en la
        // identidad mientras aún no tiene dueño. El re-sellado posterior a ligar hace
        // que la última escritura sea siempre nuestra.
        const email = freshEmail();
        const guest = await createGuest(email);

        await provisionAccount(getContainer(), {
          email,
          customerId: guest.id,
          trigger: "job",
        });

        const [identity] = await authService().listProviderIdentities(
          { entity_id: email, provider: "emailpass" },
          { select: ["entity_id", "provider_metadata"] },
        );
        const sealed = identity.provider_metadata?.password as string;

        // A partir de aquí `app_metadata` está puesto → el provider rechaza cualquier
        // intento de reclamar la identidad, así que ese hash ya no puede cambiar.
        const attack = await call(() =>
          api.post("/auth/customer/emailpass/register", { email, password: "atacante12345" }),
        );
        expect(attack.status).toBeGreaterThanOrEqual(400);

        const [after] = await authService().listProviderIdentities(
          { entity_id: email, provider: "emailpass" },
          { select: ["entity_id", "provider_metadata"] },
        );
        expect(after.provider_metadata?.password).toEqual(sealed);
        expect((await call(() => api.post(LOGIN, { email, password: "atacante12345" }))).status).toEqual(
          401,
        );
      });

      function tokenHeaders(t: string) {
        return { Authorization: `Bearer ${t}` };
      }
    });
  },
});
