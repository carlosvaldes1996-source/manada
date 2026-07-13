/**
 * Capa de medición del embudo (SEO & Tracking, D46). Punto único de importación
 * para la app: los eventos empujan al `dataLayer` y GTM enruta a los destinos.
 */
export { GTM_ID, ANALYTICS_ENABLED } from "./config";
export {
  trackOnboardingStart,
  trackRecommendationShown,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackSubscription,
} from "./events";
