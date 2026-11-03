import type { LensDTO } from "./dto";
import { Product } from "./product";
import { MOUNTS, type LensMount, type Mount } from "./specs";

export class Lens extends Product {
  readonly type = "lens";
  readonly mount: LensMount;
  readonly focalLength: { min: number; max: number };
  readonly maxAperture: number;
  readonly stabilized: boolean;

  constructor(dto: LensDTO) {
    super(dto, Product.standaloneState(dto));
    this.mount = dto.mount;
    this.focalLength = { ...dto.focalLength };
    this.maxAperture = dto.maxAperture;
    this.stabilized = dto.stabilized;
  }

  get isPrime() {
    return this.focalLength.min === this.focalLength.max;
  }

  getSpecs() {
    const { min, max } = this.focalLength;
    return [
      { label: "Mount", value: MOUNTS[this.mount] },
      { label: "Focal length", value: this.isPrime ? `${min}mm` : `${min}–${max}mm` },
      { label: "Max aperture", value: `f/${this.maxAperture}` },
      { label: "Type", value: this.isPrime ? "Prime" : "Zoom" },
      { label: "Stabilization", value: this.stabilized ? "Yes" : "No" },
    ];
  }

  fitsMount(mount: Mount) {
    return this.mount === mount;
  }

  toDTO(): LensDTO {
    return {
      ...this.standaloneFields(),
      type: this.type,
      mount: this.mount,
      focalLength: { ...this.focalLength },
      maxAperture: this.maxAperture,
      stabilized: this.stabilized,
    };
  }
}
