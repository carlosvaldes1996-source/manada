import type { Metadata } from "next";
import { AccountView } from "./account-view";

export const metadata: Metadata = { title: "Mi cuenta" };

export default function CuentaPage() {
  return <AccountView />;
}
