import type { Metadata } from "next";
import { PaymentMethodsView } from "./payment-methods-view";

export const metadata: Metadata = { title: "Mis tarjetas" };

export default function PagosPage() {
  return <PaymentMethodsView />;
}
