import { Camera } from "./camera";
import type { FilmCameraDTO } from "./dto";
import { FILM_CAMERA_STYLES, FILM_FORMATS, type FilmCameraStyle, type FilmFormat } from "./specs";

export class FilmCamera extends Camera {
  readonly medium = "film";
  readonly filmFormat: FilmFormat;
  readonly style: FilmCameraStyle;

  constructor(dto: FilmCameraDTO) {
    super(dto);
    this.filmFormat = dto.filmFormat;
    this.style = dto.style;
  }

  protected mediumSpecs() {
    return [
      { label: "Film format", value: FILM_FORMATS[this.filmFormat] },
      { label: "Camera style", value: FILM_CAMERA_STYLES[this.style] },
    ];
  }

  toDTO(): FilmCameraDTO {
    return {
      ...this.cameraFields(),
      medium: this.medium,
      filmFormat: this.filmFormat,
      style: this.style,
    };
  }
}
