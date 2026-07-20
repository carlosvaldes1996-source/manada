import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Heart } from "@medusajs/icons";
import {
  Badge,
  Container,
  DataTable,
  DataTablePaginationState,
  Heading,
  Text,
  createDataTableColumnHelper,
  useDataTable,
} from "@medusajs/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { sdk } from "../../lib/sdk";

/**
 * Sección "Mascotas" del Backoffice (Fase 4 · Bloque 1). Explorador de solo
 * lectura del activo del negocio: mascotas registradas con su cliente y el
 * alimento que tienen asignado. Reutiliza el patrón `DataTable` nativo del Admin
 * de Medusa (misma UI que el resto del panel) sobre `GET /admin/pets`.
 */

type PetRow = {
  id: string;
  name: string;
  species: string;
  stage: string;
  breed: string | null;
  weight_kg: number | null;
  created_at: string;
  customer: { id: string; email: string; name: string | null } | null;
  food: { id: string; title: string } | null;
};

type PetsResponse = {
  pets: PetRow[];
  count: number;
  limit: number;
  offset: number;
};

const PAGE_SIZE = 20;

const SPECIES_LABEL: Record<string, string> = {
  perro: "Perro",
  gato: "Gato",
  otro: "Otro",
};
const STAGE_LABEL: Record<string, string> = {
  cachorro: "Cachorro",
  adulto: "Adulto",
  senior: "Senior",
};

const columnHelper = createDataTableColumnHelper<PetRow>();

const columns = [
  columnHelper.accessor("name", {
    header: "Nombre",
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  columnHelper.accessor("species", {
    header: "Especie",
    cell: ({ getValue }) => SPECIES_LABEL[getValue()] ?? getValue(),
  }),
  columnHelper.accessor("stage", {
    header: "Etapa",
    cell: ({ getValue }) => (
      <Badge size="2xsmall">{STAGE_LABEL[getValue()] ?? getValue()}</Badge>
    ),
  }),
  columnHelper.accessor("breed", {
    header: "Raza",
    cell: ({ getValue }) => getValue() || "—",
  }),
  columnHelper.accessor("weight_kg", {
    header: "Peso",
    cell: ({ getValue }) => {
      const weight = getValue();
      return weight != null ? `${weight} kg` : "—";
    },
  }),
  columnHelper.accessor("food", {
    header: "Alimento asignado",
    enableSorting: false,
    cell: ({ getValue }) => getValue()?.title ?? "—",
  }),
  columnHelper.accessor("customer", {
    header: "Cliente",
    enableSorting: false,
    cell: ({ getValue }) => {
      const customer = getValue();
      return customer ? customer.name ?? customer.email : "—";
    },
  }),
];

const PetsPage = () => {
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [search, setSearch] = useState("");

  const offset = pagination.pageIndex * pagination.pageSize;

  const { data, isLoading } = useQuery({
    queryKey: ["manada-pets", offset, pagination.pageSize, search],
    queryFn: () =>
      sdk.client.fetch<PetsResponse>("/admin/pets", {
        query: {
          limit: pagination.pageSize,
          offset,
          q: search || undefined,
        },
      }),
    placeholderData: keepPreviousData,
  });

  const table = useDataTable({
    columns,
    data: data?.pets ?? [],
    rowCount: data?.count ?? 0,
    getRowId: (row) => row.id,
    isLoading,
    pagination: { state: pagination, onPaginationChange: setPagination },
    search: { state: search, onSearchChange: setSearch },
  });

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Mascotas</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            El activo del negocio — {data?.count ?? 0} registradas
          </Text>
        </div>
      </div>
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-end px-6 py-4">
          <DataTable.Search placeholder="Buscar por nombre…" />
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Mascotas",
  icon: Heart,
});

export default PetsPage;
