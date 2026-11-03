import type { Product } from "./product";
import { MOUNTS, type Mount } from "./specs";

/**
 * "What fits this camera?" lookup. Built once per catalog in O(products × mounts),
 * then each lookup is O(1).
 */
export class CompatibilityIndex {
  private readonly byMount = new Map<Mount, Product[]>();

  constructor(products: Iterable<Product>) {
    const all = [...products];
    for (const mount of Object.keys(MOUNTS) as Mount[]) {
      this.byMount.set(
        mount,
        all.filter((product) => product.fitsMount(mount)),
      );
    }
  }

  forMount(mount: Mount): readonly Product[] {
    return this.byMount.get(mount) ?? [];
  }
}
