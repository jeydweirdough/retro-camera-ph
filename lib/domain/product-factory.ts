import { Accessory } from "./accessory";
import { Bundle } from "./bundle";
import { DigitalCamera } from "./digital-camera";
import type { ProductDTO, ProductType } from "./dto";
import { FilmCamera } from "./film-camera";
import { Lens } from "./lens";
import type { Product } from "./product";

type Builders = {
  [T in ProductType]: (dto: Extract<ProductDTO, { type: T }>) => Product;
};

/** One builder per product type. Adding a type = adding one line here. */
const builders: Builders = {
  camera: (dto) => (dto.medium === "film" ? new FilmCamera(dto) : new DigitalCamera(dto)),
  lens: (dto) => new Lens(dto),
  accessory: (dto) => new Accessory(dto),
  bundle: (dto) =>
    new Bundle(
      dto,
      dto.items.map((item) => ({
        product: productFromDTO(item.product),
        quantity: item.quantity,
      })),
    ),
};

/** Turns plain data from a repository into the matching domain class. */
export function productFromDTO(dto: ProductDTO): Product {
  const build = builders[dto.type] as (dto: ProductDTO) => Product;
  return build(dto);
}
