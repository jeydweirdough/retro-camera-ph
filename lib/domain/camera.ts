import type { Catalog } from "./catalog";
import type { CameraDTO } from "./dto";
import { Product } from "./product";
import { MOUNTS, type Mount, type Spec } from "./specs";

export const CAMERA_MEDIA = { digital: "Digital", film: "Film" } as const;
export type CameraMedium = keyof typeof CAMERA_MEDIA;

/**
 * What every camera shares: a mount, and lenses/accessories that fit it.
 * Digital and film cameras add their own specs via `mediumSpecs()`.
 */
export abstract class Camera extends Product {
  readonly type = "camera";
  abstract readonly medium: CameraMedium;
  readonly mount: Mount;

  protected constructor(dto: CameraDTO) {
    super(dto, Product.standaloneState(dto));
    this.mount = dto.mount;
  }

  /** Specs only this kind of camera has. */
  protected abstract mediumSpecs(): Spec[];

  abstract toDTO(): CameraDTO;

  getSpecs() {
    return [
      { label: "Type", value: CAMERA_MEDIA[this.medium] },
      { label: "Mount", value: MOUNTS[this.mount] },
      ...this.mediumSpecs(),
    ];
  }

  matchesMount(mount: Mount) {
    return this.mount === mount;
  }

  /** A camera's companions are the lenses and accessories that fit it. */
  companionsIn(catalog: Catalog) {
    return catalog.fitting(this.mount);
  }

  protected cameraFields() {
    return { ...this.standaloneFields(), type: "camera" as const, mount: this.mount };
  }
}
