# API — Endpoints, contratos, integraciones

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Contratos de API entre frontend y backend, e integraciones externas CL. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | ⬜ Borrador — se completa en Fase 4. |
> | **Last Updated** | 2026-06-29 |
> | **Depends On** | ARCHITECTURE.md, DATABASE.md |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ de *contratos de API* (cuando madure en Fase 4). |

> *Estado: ⬜ Pendiente (Fase 4).*

## 1. Alcance (a definir)
API entre frontend Next.js y backend e-commerce (Medusa u otro), más integraciones externas CL.

## 2. Dominios de endpoints (borrador)
- **Catálogo:** productos, categorías, búsqueda, filtros.
- **Carrito / Checkout:** carrito, cálculo de despacho, creación de orden, pago.
- **Mascotas:** CRUD de perfil de mascota, recomendaciones personalizadas.
- **Suscripciones:** crear/pausar/cancelar, cálculo de frecuencia, próxima entrega.
- **Cuenta:** auth, direcciones, pedidos, boletas.
- **Webhooks:** pago (Webpay/MercadoPago), courier (tracking), WhatsApp.

## 3. Integraciones externas
- Transbank Webpay Plus · Mercado Pago · Khipu.
- Couriers (Blue Express/Starken/Chilexpress) — cotización y tracking.
- SII (LibreDTE/Bsale) — emisión de boleta.
- WhatsApp Business API — recordatorios.

## 4. Pendientes
- Definir contratos (REST/GraphQL), auth, rate limiting, idempotencia en pagos.
