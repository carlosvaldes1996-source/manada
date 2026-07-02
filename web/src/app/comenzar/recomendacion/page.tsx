import type { Metadata } from "next";
import { RecommendationView } from "./recommendation-view";

export const metadata: Metadata = {
  title: "Tu recomendación",
  description: "La comida que mejor le calza a tu mascota, con cuánto come, cuánto le dura y cuándo reponerla.",
};

export default function RecomendacionPage() {
  return <RecommendationView />;
}
