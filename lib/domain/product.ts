import { CATEGORIES } from "./categories";
import type { Catalog } from "./catalog";
import type {
  ProductDTO,
  ProductFields,
  ProductImage,
  ProductType,
  StandaloneFields,
} from "./dto";
import { DEFAULT_CURRENCY, type Currency, type Money } from "./money";
import { PriceList, type PriceMap } from "./price-list";
import { CONDITIONS, type Condition, type Mount, type Spec } from "./specs";

/** What a product is selling at: own values, or derived (bundles). */
export interface ProductState {
  prices: PriceList;
  stock: number;
  condition: Condition;
  conditionNotes?: string;
}

/**
 * Base of every product type. Holds what all products share and defines the
 * contract each subclass fills in: how it describes itself (`getSpecs`),
 * what fits it (`fitsMount`), and what it pairs with (`companionsIn`).
 */
export abstract class Product {
  abstract readonly type: ProductType;

  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly brand: string;
  readonly description: string;
  readonly images: readonly ProductImage[];
  readonly updatedAt?: string;
  readonly listedAt?: string;
  readonly prices: PriceList;
  readonly stock: number;
  readonly condition: Condition;
  readonly conditionNotes?: string;

  protected constructor(fields: ProductFields, state: ProductState) {
    this.id = fields.id;
    this.slug = fields.slug;
    this.name = fields.name;
    this.brand = fields.brand;
    this.description = fields.description;
    this.images = fields.images;
    this.updatedAt = fields.updatedAt;
    this.listedAt = fields.listedAt;
    this.prices = state.prices;
    this.stock = state.stock;
    this.condition = state.condition;
    this.conditionNotes = state.conditionNotes;
  }

  /** State for products sold on their own (everything except bundles). */
  protected static standaloneState(dto: StandaloneFields): ProductState {
    return {
      prices: PriceList.fromMap(dto.prices),
      stock: dto.stock,
      condition: dto.condition,
      conditionNotes: dto.conditionNotes,
    };
  }

  get isUsed() {
    return this.condition !== "new";
  }

  /** "New", or "Used – Excellent". */
  get conditionLabel() {
    return this.isUsed ? `Used – ${CONDITIONS[this.condition]}` : CONDITIONS.new;
  }

  abstract getSpecs(): Spec[];

  abstract toDTO(): ProductDTO;

  /** Whether this product can be used with a camera of `mount`. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- subclasses use it
  fitsMount(mount: Mount): boolean {
    return false;
  }

  /** Whether the shop's mount filter should show this product for `mount`. */
  matchesMount(mount: Mount) {
    return this.fitsMount(mount);
  }

  /** Products listed under "Works with" on this product's page. */
  companionsIn(catalog: Catalog): readonly Product[] {
    return catalog.cameras().filter((camera) => this.fitsMount(camera.mount));
  }

  /** Physical stock units that buying `quantity` of this uses up. */
  stockUnits(quantity: number): [productId: string, quantity: number][] {
    return [[this.id, quantity]];
  }

  get category() {
    return CATEGORIES[this.type];
  }

  get inStock() {
    return this.stock > 0;
  }

  get path() {
    return `/product/${this.slug}`;
  }

  price(currency: Currency = DEFAULT_CURRENCY) {
    return this.prices.in(currency);
  }

  /** A higher "was" price to show struck through, if any. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- subclasses use it
  compareAtPrice(currency: Currency = DEFAULT_CURRENCY): Money | undefined {
    return undefined;
  }

  /**
   * Price (and "was" price) in every currency this product has, as plain
   * data, so the browser can switch currency without asking the server.
   */
  displayPrices(): { price: PriceMap; compareAt?: PriceMap } {
    const compareAt = this.prices
      .currencies()
      .flatMap((currency) => this.compareAtPrice(currency) ?? []);

    return {
      price: this.prices.toJSON(),
      ...(compareAt.length > 0 && { compareAt: PriceList.fromMoney(compareAt).toJSON() }),
    };
  }

  toJSON() {
    return this.toDTO();
  }

  /** schema.org Product structured data for search engines and AI crawlers. */
  toJsonLd(siteUrl: string, currency: Currency = DEFAULT_CURRENCY) {
    const url = new URL(this.path, siteUrl).toString();
    const price = this.price(currency);

    return {
      "@context": "https://schema.org",
      "@type": "Product",
      sku: this.id,
      name: this.name,
      description: this.description,
      image: this.images.map((image) => image.url),
      brand: { "@type": "Brand", name: this.brand },
      category: this.category.label,
      url,
      additionalProperty: this.getSpecs().map((spec) => ({
        "@type": "PropertyValue",
        name: spec.label,
        value: spec.value,
      })),
      offers: {
        "@type": "Offer",
        url,
        price: price.toDecimalString(),
        priceCurrency: price.currency,
        availability: this.inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition: this.isUsed
          ? "https://schema.org/UsedCondition"
          : "https://schema.org/NewCondition",
      },
    };
  }

  /** Fields shared by every DTO, for subclasses' `toDTO()`. */
  protected baseFields(): ProductFields {
    return {
      id: this.id,
      slug: this.slug,
      name: this.name,
      brand: this.brand,
      description: this.description,
      images: [...this.images],
      ...(this.updatedAt && { updatedAt: this.updatedAt }),
      ...(this.listedAt && { listedAt: this.listedAt }),
    };
  }

  /** Shared fields plus own price and stock, for standalone products. */
  protected standaloneFields(): StandaloneFields {
    return {
      ...this.baseFields(),
      prices: this.prices.toJSON(),
      stock: this.stock,
      condition: this.condition,
      ...(this.conditionNotes && { conditionNotes: this.conditionNotes }),
    };
  }
}
