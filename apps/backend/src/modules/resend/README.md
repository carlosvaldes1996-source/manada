# Emails transaccionales (Resend) — D45

Provider del **Notification Module** de Medusa + sistema de plantillas React Email.
Contrato y decisión: `ai-context/API.md §11` · `ai-context/DECISIONS.md D45`.

## Estructura

```
modules/resend/
├── index.ts            ModuleProvider(NOTIFICATION) → registra el service
├── service.ts          ResendNotificationProviderService (render + envío / modo DEV)
└── emails/
    ├── theme.ts        tokens de marca (espejo de globals.css) + formatCLP
    ├── base.tsx        EmailLayout + componentes comunes (Title, Button, DataRow…)
    ├── index.ts        registro: EmailTemplate id → { subject, render }
    ├── welcome.tsx
    ├── reset-password.tsx
    ├── order-placed.tsx
    └── order-shipped.tsx
```

## Cómo agregar un email nuevo

1. Crea `emails/mi-email.tsx` usando **solo** los componentes de `base.tsx` (no dupliques markup).
   Exporta `default` (el componente) y `subject(data)`.
2. Regístralo en `emails/index.ts`: añade un id a `EmailTemplate` y su entrada en `emailTemplates`.
3. Dispáralo desde un subscriber en `src/subscribers/` sobre un evento nativo:

   ```ts
   const notifications = container.resolve(Modules.NOTIFICATION)
   await notifications.createNotifications({
     to: email, channel: "email",
     template: EmailTemplate.MiEmail, data: { ... },
   })
   ```

## Variables de entorno

- `RESEND_API_KEY` — sin ella, **modo DEV**: loguea los emails, no envía.
- `RESEND_FROM` — remitente, ej. `Manada <hola@tumanada.cl>` (requiere dominio verificado en Resend).
- `STOREFRONT_URL` — base de los CTAs y del enlace de recuperación.

## Emails ↔ eventos

| Plantilla | Evento | Subscriber |
|---|---|---|
| `welcome` | `customer.created` (solo `has_account`) | `customer-created.ts` |
| `reset-password` | `auth.password_reset` | `password-reset.ts` |
| `order-placed` | `order.placed` | `order-placed-email.ts` |
| `order-shipped` | `shipment.created` | `order-shipped.ts` |

Suscripción: **diferida** (sin eventos de recurrencia en el backend, D22/D29). Ver `API.md §11.3`.
