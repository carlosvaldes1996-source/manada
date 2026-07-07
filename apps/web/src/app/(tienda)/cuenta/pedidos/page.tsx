import type { Metadata } from "next";
import { OrdersView } from "./orders-view";

export const metadata: Metadata = { title: "Mis pedidos" };

export default function PedidosPage() {
  return <OrdersView />;
}
