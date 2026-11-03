import { Camera } from "./camera";
import type { DigitalCameraDTO } from "./dto";
import { SENSORS, type Sensor } from "./specs";

export class DigitalCamera extends Camera {
  readonly medium = "digital";
  readonly sensor: Sensor;
  readonly megapixels: number;
  readonly video: string;

  constructor(dto: DigitalCameraDTO) {
    super(dto);
    this.sensor = dto.sensor;
    this.megapixels = dto.megapixels;
    this.video = dto.video;
  }

  protected mediumSpecs() {
    return [
      { label: "Sensor", value: SENSORS[this.sensor] },
      { label: "Resolution", value: `${this.megapixels} MP` },
      { label: "Video", value: this.video },
    ];
  }

  toDTO(): DigitalCameraDTO {
    return {
      ...this.cameraFields(),
      medium: this.medium,
      sensor: this.sensor,
      megapixels: this.megapixels,
      video: this.video,
    };
  }
}
