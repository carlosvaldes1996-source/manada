/**
 * Configuración de tracking (SEO & Tracking, D46).
 *
 * GTM es el ÚNICO punto de integración de medición: el ID del contenedor se
 * inyecta por env (`NEXT_PUBLIC_GTM_ID`, formato `GTM-XXXXXXX`). GA4, Meta Pixel
 * y Google Ads se conectan DENTRO de GTM, no en el código — así se agregan/quitan
 * destinos sin tocar el front. Sin el ID, no se carga GTM ni se envían eventos
 * (dev queda limpio; los pushes al dataLayer son inofensivos).
 */
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/** ¿Está el tracking habilitado? (hay contenedor GTM configurado). */
export const ANALYTICS_ENABLED = Boolean(GTM_ID);
