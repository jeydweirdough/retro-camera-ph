# Camera E-commerce — Project Plan

Goal: a full-featured camera store with **minimal code**, built on the
**4 pillars of OOP** and **DRY**.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16.4 (App Router, Cache Components on), React 19.3, Tailwind 4 |
| Product content | **Sanity** (products, bundles, promos, FAQs, buying guides) |
| Payments | **Manual, no processor, QR codes only (for now)**: customer scans a QR code, pays, uploads the receipt. Free OCR (Tesseract.js) pre-checks it; an admin confirms. QR codes and account details are **managed in Sanity**. Processors (PayMongo/Stripe) deferred. |
| Receipt images | Vercel Blob (Vercel's filesystem is not persistent) |
| Accounts, orders, reviews, wishlist | Postgres (Neon, free tier) + Drizzle ORM *(free, open source)* |
| Auth | Better Auth *(free, open source)* |
| Hosting | Vercel |

> Sanity is a content store, not a user/order database — that's why accounts
> and orders need their own DB.

## Architecture: 4 layers

```
app/          Routes. Thin: fetch via repositories, render components.
components/   UI. Composition only (BaseButton → PrimaryButton pattern).
lib/domain/   OOP core. Pure TypeScript classes, no React, no Sanity.
lib/data/     Repositories. The only code that talks to Sanity, the DB, Blob storage, or OCR.
```

Dependency rule: `app → components → domain ← data`. The domain knows nothing
about Sanity or the DB, so the data source can change without touching pages.

### Server/client boundary rule (Next 16)

Class instances can't cross into Client Components, and `use cache` results must
be serializable. So:

1. Repositories return **plain DTOs** (cacheable with `use cache`).
2. Server code hydrates DTOs into classes: `Camera.fromDTO(dto)`.
3. Classes expose `toJSON()` to send plain data to Client Components.
4. Request-time values (currency cookie, user session) are read **outside**
   cached functions and passed in as arguments.

## Domain model (`lib/domain/`)

```
abstract Product                 id, slug, name, brand, images, prices: PriceList
  ├─ Camera                      mount, sensor, megapixels, video
  ├─ Lens                        mount, focalLength, aperture
  ├─ Accessory                   category, compatibleMounts[]
  └─ Bundle                      items: Product[], discount → price is derived

  abstract getSpecs(): Spec[]    each subclass describes itself
  abstract getCategory(): string
  toJsonLd(): schema.org Product (shared, subclasses extend)

Money                            amount (integer minor units) + currency; immutable
PriceList                        Map<Currency, Money>

abstract Promotion               isEligible(cart), apply(cart): Discount
  ├─ PercentOff, FixedOff, BuyXGetY, FreeShipping, BundleDeal

Cart                             private Map<productId, CartLine>
                                 add / remove / setQty / subtotal / total(promos)

PaymentGateway (interface)       start(order), status
  ├─ QrPaymentGateway            manual: shows QR from Sanity → "awaiting verification"
  └─ (later) BankTransferGateway, PayMongoGateway, StripeGateway, CashOnDeliveryGateway

PaymentMethod                    from Sanity: name, type, QR image, account name,
                                 masked account no., instructions, enabled, order

ReceiptReader (interface)        read(image) → { amount, reference, date, recipient }
  └─ TesseractReceiptReader      free OCR; swappable later
ReceiptCheck                     compares OCR result to the order → pass / flags

SortStrategy                     PriceAsc, PriceDesc, Newest, Popular
Filter                           Brand, Mount, PriceRange, SensorSize
```

### 4 pillars map

| Pillar | Where |
|---|---|
| **Abstraction** | `Product`, `Promotion`, `ProductRepository` — callers use the contract, not the details |
| **Inheritance** | `Camera/Lens/Accessory/Bundle extends Product`; promo subclasses extend `Promotion`; props interfaces extend each other |
| **Encapsulation** | `Cart` (private Map, mutations only via methods), `Money` (immutable, integer math, only place that formats) |
| **Polymorphism** | `getSpecs()`, `toJsonLd()`, `Promotion.apply()`, `SortStrategy.compare()` — one call site, many behaviors |

### DSA

| Use | Structure | Why |
|---|---|---|
| Cart lines | `Map<id, CartLine>` | O(1) add / update / remove |
| Prices per currency | `Map<Currency, Money>` | O(1) lookup |
| Lens compatibility | `Map<Mount, Lens[]>` index | O(1) "lenses that fit this camera" |
| Active filters | `Set<string>` per facet | O(1) toggle / contains |
| Sorting | comparator strategies | `O(n log n)`, swappable |
| Money | integer minor units | avoids float rounding bugs |

### DRY rules

- One `ProductCard`, one `SpecTable`, one `PriceTag` for every product type.
- Every new button/input/badge variant wraps a `Base*` component.
- JSON-LD, metadata, and sitemap entries are generated **from domain classes**,
  never hand-written per page.
- One `formatMoney` path: `Money#format(locale)`.

## Features

### MVP
- Catalog: home, shop (filters + sort), product detail with specs
- Lens/accessory compatibility by mount
- Cart (localStorage for guests, DB for signed-in users)
- Promos and bundles/kits (managed in Sanity)
- Multi-currency (per-currency prices in Sanity; selected currency in a cookie)
- Accounts: sign up / login / order history
- Checkout via QR code (QR Ph / bank / e-wallet QR, all configured in Sanity):
  1. Order created as `awaiting_payment`, with a unique order code and a
     unique amount (random centavos, e.g. ₱49,999.37) to make matching easy
  2. Customer picks a payment method, scans its QR, pays, uploads receipt
     screenshot
  3. OCR pre-check: amount, reference no., date, recipient account; duplicate
     reference numbers rejected (unique DB index)
  4. Admin queue: admin checks the real bank/e-wallet statement, then marks
     `paid` → order ships
  5. Unpaid orders expire and release reserved stock

### Growth (after MVP)
- Compare cameras side by side (reuses `getSpecs()`)
- Reviews + ratings (feeds `AggregateRating` JSON-LD)
- Wishlist, recently viewed, "frequently bought together"
- Buying guides / FAQ content from Sanity

## SEO + AEO

- `generateMetadata` on every route: title, description, canonical, Open Graph.
- `app/sitemap.ts` from the catalog (`generateSitemaps` if > 50k URLs).
- `app/robots.ts`: allow search engines **and AI crawlers** (GPTBot,
  ClaudeBot, PerplexityBot, Google-Extended); disallow `/cart`, `/checkout`,
  `/account`.
- JSON-LD via `toJsonLd()`: `Product` + `Offer`, `AggregateRating`,
  `BreadcrumbList`, `FAQPage`, `Organization`. Escape `<` as its unicode escape `<` (XSS).
- `/llms.txt` route summarizing categories, brands, and key pages for AI agents.
- AEO content: FAQ blocks and buying guides as clear Q&A so AI engines can cite them.

## Security rules

- **Never trust client prices.** Server rebuilds the cart from product IDs,
  re-prices from Sanity, re-applies promos, then creates the order.
- **OCR is a pre-check, never proof of payment.** Screenshots can be edited or
  reused. An order is `paid` only after an admin confirms the money arrived.
- OCR runs on the server; client-side results are never trusted.
- Receipt uploads: images only, size limit, private storage, admin-only access.
- Sanity write tokens and DB credentials stay server-only.

## Phases

1. **Foundation** — domain classes + unit tests, `Money`, Sanity schemas,
   `ProductRepository`, UI kit (Base* pattern), fix current button issues.
2. **Catalog + SEO/AEO** — shop, product pages, compatibility, metadata,
   JSON-LD, sitemap, robots, llms.txt.
3. **Cart + promos + bundles + currency switcher.**
4. **Accounts + bank-transfer checkout + receipt OCR + admin payment queue +
   order history.**
5. **Growth features.**

## Open decisions

- Supported currencies and default currency. QR Ph settles in PHP only, so
  other currencies are display-only until a processor is added.
- Vercel plan: Hobby is for non-commercial use only; a live store needs Pro.
- Test runner (Vitest proposed for domain classes).
