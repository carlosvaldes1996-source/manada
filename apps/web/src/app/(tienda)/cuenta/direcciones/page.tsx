import type { Metadata } from "next";
import { AddressesView } from "./addresses-view";

export const metadata: Metadata = { title: "Mis direcciones" };

export default function DireccionesPage() {
  return <AddressesView />;
}
