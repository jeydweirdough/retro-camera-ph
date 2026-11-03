import type { AccessoryDTO } from "./dto";
import { Product } from "./product";
import { MOUNTS, type Mount } from "./specs";

export class Accessory extends Product {
  readonly type = "accessory";
  readonly kind: string;
  readonly compatibleMounts: readonly Mount[];

  constructor(dto: AccessoryDTO) {
    super(dto, Product.standaloneState(dto));
    this.kind = dto.kind;
    this.compatibleMounts = [...dto.compatibleMounts];
  }

  /** Bags, memory cards, tripods: no mount restriction. */
  get isUniversal() {
    return this.compatibleMounts.length === 0;
  }

  getSpecs() {
    return [
      { label: "Type", value: this.kind },
      {
        label: "Compatibility",
        value: this.isUniversal
          ? "All cameras"
          : this.compatibleMounts.map((mount) => MOUNTS[mount]).join(", "),
      },
    ];
  }

  fitsMount(mount: Mount) {
    return this.isUniversal || this.compatibleMounts.includes(mount);
  }

  /** Universal items fit everything, so they'd clutter every mount filter. */
  matchesMount(mount: Mount) {
    return this.compatibleMounts.includes(mount);
  }

  toDTO(): AccessoryDTO {
    return {
      ...this.standaloneFields(),
      type: this.type,
      kind: this.kind,
      compatibleMounts: [...this.compatibleMounts],
    };
  }
}
