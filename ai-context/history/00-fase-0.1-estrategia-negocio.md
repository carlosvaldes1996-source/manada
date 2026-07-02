# Fase 0.1 — Estrategia y Posicionamiento de Negocio

> Estado: ✅ Cerrada · Fecha: 2026-06-27

---

## 1. Objetivo del proyecto

Construir el mejor e-commerce de alimentos y accesorios para mascotas de Chile: una experiencia comparable a Mercado Libre, Amazon y Shopify, pero adaptada al mercado chileno. No una plantilla genérica, sino una marca con potencial de **referente nacional de la categoría**.

## 2. Decisiones tomadas

| # | Decisión | Valor elegido | Rationale |
|---|---|---|---|
| D1 | Alcance / modelo | **Tienda completa**: alimento + accesorios + farmacia, con **suscripción** como motor de LTV | Compite de frente con los grandes, pero el diferenciador real es la recompra recurrente (alimento = consumo predecible = mayor LTV) |
| D2 | Stack técnico | **Custom headless con Next.js** | Control total, diseño 100% original, performance de élite. Descarta Shopify (menos original, fees) y marketplace multi-tienda (demasiada complejidad inicial) |

## 3. Lectura del mercado chileno

- **Competencia directa:** PetCity, PetVet, SuperZoo, PetHome, DrPet, Petco Chile, Mercado Libre, retail (Jumbo/Lider Pet), veterinarias online.
- **Dolores del cliente CL:**
  - Flete caro/lento para sacos de 15-20 kg.
  - Precios poco transparentes; sorpresas de despacho en el checkout.
  - Poca personalización ("¿qué le doy a mi perro senior con sobrepeso?").
- **Oportunidades:**
  - **Suscripción / recompra automática** (santo grial del LTV).
  - **Personalización por mascota**.
  - **Despacho rápido y honesto**, especialmente RM.

## 4. Integraciones imprescindibles (Chile)

- **Pagos:** Webpay Plus (Transbank), Mercado Pago, Khipu/transferencia.
- **Despacho:** Blue Express, Starken, Chilexpress (cotización por API).
- **Tributario:** boleta/factura electrónica SII (vía proveedor: LibreDTE / Bsale).

## 5. Tesis estratégica inicial

> El diferenciador no es "vender comida de mascotas", sino construir **el mejor sistema de recompra + personalización por mascota de Chile**.

*(Esta tesis evolucionó en Fase 0.3 hacia el concepto rector definitivo basado en "conocimiento que se anticipa".)*

## 6. Métricas norte

- Tasa de suscripción.
- Recompra a 90 días.
- AOV (ticket promedio).
- % de pedidos con despacho prometido cumplido.

## 7. Pendientes derivados

- Definir proveedores concretos de pago, courier y boleta (→ Fase 4).
- Validar backend e-commerce (Medusa.js u otro) (→ Fase 4).
