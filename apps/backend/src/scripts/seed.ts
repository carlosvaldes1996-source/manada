import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { ApiKey } from "../../.medusa/types/query-entry-points";

/**
 * Seed del MVP de Manada (D22, MVP-first).
 * - Mercado: Chile. Moneda: CLP (cero decimales; amount = pesos).
 * - Pago: `pp_system_default` = pago manual/offline de Medusa (transferencia).
 *   El pedido queda registrado y se confirma a mano en el Admin. Sin Webpay aún.
 * - Despacho: fulfillment `manual_manual` — se gestiona manualmente (D22).
 * - Catálogo alineado con apps/web/src/lib/data/catalog.ts (mismos slugs/precios).
 */

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => {
              return {
                currency_code: currency.currency_code,
                is_default: currency.is_default ?? false,
              };
            }
          ),
        },
      };
    });

    const stores = updateStoresStep(normalizedInput);

    return new WorkflowResponse(stores);
  }
);

export default async function seedManadaData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["cl"];

  logger.info("Seeding store data (Manada · Chile · CLP)...");
  const [store] = await storeModuleService.listStores();
  // Reutiliza el sales channel existente (las migraciones crean uno por defecto).
  // Crear uno nuevo dejaría la publishable key ligada a 2 canales y rompería la
  // creación de carrito sin `sales_channel_id`. Solo se crea si no existe ninguno.
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({});

  if (!defaultSalesChannel.length) {
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [{ name: "Manada Web" }],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [{ currency_code: "clp", is_default: true }],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });

  logger.info("Seeding region data (Chile)...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Chile",
          currency_code: "clp",
          countries,
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Bodega Manada (Santiago)",
          address: {
            city: "Santiago",
            country_code: "CL",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_location_id: stockLocation.id,
      },
    },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [{ name: "Default Shipping Profile", type: "default" }],
        },
      });
    shippingProfile = shippingProfileResult[0];
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Despacho Manada",
    type: "shipping",
    service_zones: [
      {
        name: "Chile",
        geo_zones: [{ country_code: "cl", type: "country" }],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Despacho Estándar",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Estándar",
          description: "Llega en 2–3 días hábiles.",
          code: "standard",
        },
        prices: [
          { currency_code: "clp", amount: 3990 },
          { region_id: region.id, amount: 3990 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
      {
        name: "Despacho Express",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Llega en 24 horas (RM).",
          code: "express",
        },
        prices: [
          { currency_code: "clp", amount: 5990 },
          { region_id: region.id, amount: 5990 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding publishable API key data...");
  let publishableApiKey: ApiKey | null = null;
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id"],
    filters: { type: "publishable" },
  });

  publishableApiKey = data?.[0];

  if (!publishableApiKey) {
    const {
      result: [publishableApiKeyResult],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          { title: "Manada Web", type: "publishable", created_by: "" },
        ],
      },
    });

    publishableApiKey = publishableApiKeyResult as ApiKey;
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding product data (catálogo Manada)...");

  // ─────────────────────────────────────────────────────────────────────────
  // Metadata propia de Manada (atributos de merchandising que no son nativos de
  // Medusa). Viven en `product.metadata` pero se capturan con el widget validado
  // "Atributos Manada" (`src/admin/widgets/product-manada-attributes.tsx`) en la
  // ficha del producto — NO en el editor de metadata cruda: así los valores que
  // deciden el motor (especie/etapa/condiciones) nunca se escriben mal. El frontend
  // NO infiere nada; lee estos valores tal cual (ver apps/web/src/lib/medusa/map-product.ts).
  //
  // Convención de claves (documentada en ai-context/DATABASE.md):
  //   brand                            → string   (marca visible; ej. "Royal Canin")
  //   species                          → "perro" | "gato" | "otro", separadas por coma
  //   stage                            → "cachorro" | "adulto" | "senior", separadas por coma
  //   subscribable                     → boolean  (¿admite suscripción?)
  //   subscription_discount_percentage → number   (% de ahorro; el precio de suscripción
  //                                                 lo CALCULA el backend, no se guarda)
  //   ingredients                      → string   (texto libre; se captura en el widget)
  //   kcal_per_kg                      → number   (SOLO alimento; energía metabolizable
  //                                                kcal/kg — base del cálculo de ración RER/MER)
  //   suitable_conditions              → condiciones que atiende, separadas por coma
  //                                       (vocab: Sobrepeso, Piel sensible, Problemas renales,
  //                                        Articulaciones, Digestión sensible)
  //   not_for                          → condiciones contraindicadas, separadas por coma
  //                                       (mismo vocab; el motor NUNCA recomienda si calza)
  //
  // Nota: el Admin guarda metadata como strings; tanto el mapper como el
  // middleware de precio aceptan string o valor nativo (boolean/number).
  // ─────────────────────────────────────────────────────────────────────────

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        { name: "Alimento", is_active: true },
        { name: "Accesorios", is_active: true },
        { name: "Farmacia", is_active: true },
        { name: "Higiene", is_active: true },
        { name: "Snacks", is_active: true },
      ],
    },
  });

  const cat = (name: string) =>
    categoryResult.find((c) => c.name === name)!.id;

  const salesChannelLink = [{ id: defaultSalesChannel[0].id }];

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Royal Canin — Adulto Razas Pequeñas",
          handle: "royal-canin-adulto-razas-pequenas-3kg",
          category_ids: [cat("Alimento")],
          description:
            "Alimento seco para perros adultos de razas pequeñas. Nutrición precisa para el día a día.",
          metadata: {
            brand: "Royal Canin",
            species: "perro",
            stage: "adulto",
            subscribable: true,
            subscription_discount_percentage: 15,
            kcal_per_kg: 3700,
          },
          weight: 3000,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [{ title: "Formato", values: ["3 kg"] }],
          variants: [
            {
              title: "3 kg",
              sku: "RC-ADULT-SMALL-3KG",
              options: { Formato: "3 kg" },
              prices: [{ amount: 24990, currency_code: "clp" }],
            },
          ],
          sales_channels: salesChannelLink,
        },
        {
          title: "Pro Plan — Adulto Complete Essentials",
          handle: "pro-plan-adulto-15kg",
          category_ids: [cat("Alimento")],
          description:
            "Alimento seco para perros adultos. Formato familiar de 15 kg, gran rendimiento.",
          metadata: {
            brand: "Pro Plan",
            species: "perro",
            stage: "adulto",
            subscribable: true,
            subscription_discount_percentage: 12,
            kcal_per_kg: 3800,
          },
          weight: 15000,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [{ title: "Formato", values: ["15 kg"] }],
          variants: [
            {
              title: "15 kg",
              sku: "PROPLAN-ADULT-15KG",
              options: { Formato: "15 kg" },
              prices: [{ amount: 54990, currency_code: "clp" }],
            },
          ],
          sales_channels: salesChannelLink,
        },
        {
          title: "Hill's — Prescription Diet k/d Renal",
          handle: "hills-prescription-diet-renal-2kg",
          category_ids: [cat("Alimento")],
          description:
            "Dieta veterinaria para gatos con soporte renal. Formato 2 kg.",
          metadata: {
            brand: "Hill's",
            species: "gato",
            stage: "adulto,senior",
            subscribable: true,
            subscription_discount_percentage: 10,
            kcal_per_kg: 3900,
            suitable_conditions: "Problemas renales",
          },
          weight: 2000,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [{ title: "Formato", values: ["2 kg"] }],
          variants: [
            {
              title: "2 kg",
              sku: "HILLS-KD-RENAL-2KG",
              options: { Formato: "2 kg" },
              prices: [{ amount: 32990, currency_code: "clp" }],
            },
          ],
          sales_channels: salesChannelLink,
        },
        {
          title: "Acana — Puppy Recipe",
          handle: "acana-puppy-recipe-2kg",
          category_ids: [cat("Alimento")],
          description:
            "Alimento para cachorros con ingredientes biológicamente apropiados. Formato 2 kg.",
          metadata: {
            brand: "Acana",
            species: "perro",
            stage: "cachorro",
            subscribable: true,
            subscription_discount_percentage: 12,
            kcal_per_kg: 4100,
          },
          weight: 2000,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [{ title: "Formato", values: ["2 kg"] }],
          variants: [
            {
              title: "2 kg",
              sku: "ACANA-PUPPY-2KG",
              options: { Formato: "2 kg" },
              prices: [{ amount: 28990, currency_code: "clp" }],
            },
          ],
          sales_channels: salesChannelLink,
        },
        {
          title: "NexGard — Antiparasitario Masticable (4–10 kg)",
          handle: "nexgard-antiparasitario-perro-mediano",
          category_ids: [cat("Farmacia")],
          description:
            "Antiparasitario masticable para perros de 4 a 10 kg. Caja de 3 comprimidos.",
          metadata: {
            brand: "NexGard",
            species: "perro",
            subscribable: false,
          },
          weight: 50,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [{ title: "Formato", values: ["3 comprimidos"] }],
          variants: [
            {
              title: "3 comprimidos",
              sku: "NEXGARD-M-3",
              options: { Formato: "3 comprimidos" },
              prices: [{ amount: 18990, currency_code: "clp" }],
            },
          ],
          sales_channels: salesChannelLink,
        },
        {
          title: "Manada — Cama Ortopédica Acolchada",
          handle: "cama-ortopedica-acolchada-m",
          category_ids: [cat("Accesorios")],
          description:
            "Cama ortopédica acolchada para perros y gatos. Talla M.",
          metadata: {
            brand: "Manada",
            species: "perro,gato",
            subscribable: false,
          },
          weight: 1200,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [{ title: "Talla", values: ["M"] }],
          variants: [
            {
              title: "Talla M",
              sku: "MANADA-CAMA-ORTO-M",
              options: { Talla: "M" },
              prices: [{ amount: 39990, currency_code: "clp" }],
            },
          ],
          sales_channels: salesChannelLink,
        },
        {
          // Ejemplo de la convención MULTI-FORMATO (Fase 4): UN alimento, VARIOS
          // formatos como VARIANTES (nunca productos duplicados). El peso vive en
          // cada variante (`weight`, gramos); marca/especie/etapa/kcal son del
          // PRODUCTO (compartidos por todos los formatos). Handle SIN el formato.
          title: "Royal Canin — Mini Puppy",
          handle: "royal-canin-mini-puppy",
          category_ids: [cat("Alimento")],
          description:
            "Alimento seco para cachorros de razas pequeñas. Disponible en 1 kg, 3 kg y 7.5 kg.",
          metadata: {
            brand: "Royal Canin",
            species: "perro",
            stage: "cachorro",
            subscribable: true,
            subscription_discount_percentage: 15,
            kcal_per_kg: 3800,
          },
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [{ title: "Formato", values: ["1 kg", "3 kg", "7.5 kg"] }],
          variants: [
            {
              title: "1 kg",
              sku: "RC-MINI-PUPPY-1KG",
              weight: 1000,
              options: { Formato: "1 kg" },
              prices: [{ amount: 12990, currency_code: "clp" }],
            },
            {
              title: "3 kg",
              sku: "RC-MINI-PUPPY-3KG",
              weight: 3000,
              options: { Formato: "3 kg" },
              prices: [{ amount: 29990, currency_code: "clp" }],
            },
            {
              title: "7.5 kg",
              sku: "RC-MINI-PUPPY-7-5KG",
              weight: 7500,
              options: { Formato: "7.5 kg" },
              prices: [{ amount: 59990, currency_code: "clp" }],
            },
          ],
          sales_channels: salesChannelLink,
        },
      ],
    },
  });
  logger.info("Finished seeding product data.");

  logger.info("Seeding inventory levels...");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const inventoryLevels: CreateInventoryLevelInput[] = [];
  for (const inventoryItem of inventoryItems) {
    inventoryLevels.push({
      location_id: stockLocation.id,
      stocked_quantity: 1000,
      inventory_item_id: inventoryItem.id,
    });
  }

  await createInventoryLevelsWorkflow(container).run({
    input: { inventory_levels: inventoryLevels },
  });
  logger.info("Finished seeding inventory levels data.");
}
