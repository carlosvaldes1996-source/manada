import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * `GET /admin/pets` — explorador de mascotas para el Backoffice de Manada
 * (Fase 4 · Bloque 1). Las mascotas son el activo del negocio (el moat, D34).
 *
 * El **cliente** se obtiene por traversal del Module Link Customer↔Pet
 * (`pet.customer`, nativo con `query.graph`). El **alimento asignado** es una
 * referencia plana a Product (`current_food_id`, sin link) → se resuelve por lote.
 *
 * Solo lectura: la edición del perfil vive en el storefront (`/store/pets`,
 * API.md §9). Las rutas `/admin/*` quedan autenticadas por Medusa automáticamente.
 */

const SPECIES = ["perro", "gato", "otro"];
const STAGES = ["cachorro", "adulto", "senior"];

/** Un query param puede llegar como string o string[]; normaliza al primer valor. */
function firstString(value: unknown): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const q = firstString(req.query.q);
  const speciesFilter = firstString(req.query.species);
  const stageFilter = firstString(req.query.stage);

  const filters: Record<string, unknown> = {};
  if (speciesFilter && SPECIES.includes(speciesFilter)) filters.species = speciesFilter;
  if (stageFilter && STAGES.includes(stageFilter)) filters.stage = stageFilter;
  if (q) filters.name = { $ilike: `%${q}%` };

  const { data: pets, metadata } = await query.graph({
    entity: "pet",
    fields: [
      "id",
      "name",
      "species",
      "stage",
      "breed",
      "weight_kg",
      "current_food_id",
      "created_at",
      "customer.id",
      "customer.email",
      "customer.first_name",
      "customer.last_name",
    ],
    filters,
    pagination: { skip: offset, take: limit, order: { created_at: "DESC" } },
  });

  const count = metadata?.count ?? pets.length;

  // Alimento asignado (referencia plana a Product): resolver por lote esta página.
  const foodIds = [
    ...new Set(pets.map((p) => p.current_food_id).filter(Boolean) as string[]),
  ];
  const foodsById = new Map<string, { id: string; title: string }>();
  if (foodIds.length) {
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "title"],
      filters: { id: foodIds },
    });
    for (const p of data) foodsById.set(p.id, p);
  }

  const rows = pets.map((p) => {
    const customer = p.customer;
    const food = p.current_food_id ? foodsById.get(p.current_food_id) : undefined;
    return {
      id: p.id,
      name: p.name,
      species: p.species,
      stage: p.stage,
      breed: p.breed ?? null,
      weight_kg: p.weight_kg ?? null,
      created_at: p.created_at,
      customer: customer
        ? {
            id: customer.id,
            email: customer.email ?? "",
            name:
              [customer.first_name, customer.last_name].filter(Boolean).join(" ") || null,
          }
        : null,
      food: food ? { id: food.id, title: food.title } : null,
    };
  });

  res.json({ pets: rows, count, limit, offset });
}
