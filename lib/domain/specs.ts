/** Interchangeable-lens mounts, digital and vintage. */
export const LENS_MOUNTS = {
  "sony-e": "Sony E",
  "canon-rf": "Canon RF",
  "canon-ef": "Canon EF",
  "canon-fd": "Canon FD",
  "nikon-z": "Nikon Z",
  "nikon-f": "Nikon F",
  "fujifilm-x": "Fujifilm X",
  "l-mount": "L-Mount",
  mft: "Micro Four Thirds",
  "pentax-k": "Pentax K",
  "minolta-sr": "Minolta SR / MD",
  "olympus-om": "Olympus OM",
  m42: "M42 screw mount",
  "leica-m": "Leica M",
} as const;

/** Every camera has a mount; point-and-shoots have a built-in lens. */
export const MOUNTS = {
  ...LENS_MOUNTS,
  fixed: "Fixed lens",
} as const;

export type Mount = keyof typeof MOUNTS;
export type LensMount = keyof typeof LENS_MOUNTS;

export const SENSORS = {
  "full-frame": "Full frame",
  "aps-c": "APS-C",
  mft: "Micro Four Thirds",
  "medium-format": "Medium format",
} as const;

export type Sensor = keyof typeof SENSORS;

export const FILM_FORMATS = {
  "35mm": "35mm",
  "half-frame": "Half frame (35mm)",
  "120": "Medium format (120)",
  instant: "Instant",
  "large-format": "Large format",
} as const;

export type FilmFormat = keyof typeof FILM_FORMATS;

export const FILM_CAMERA_STYLES = {
  slr: "SLR",
  rangefinder: "Rangefinder",
  "point-and-shoot": "Point-and-shoot",
  tlr: "Twin-lens reflex (TLR)",
  instant: "Instant",
} as const;

export type FilmCameraStyle = keyof typeof FILM_CAMERA_STYLES;

/** Best to worst. Order matters: a bundle takes its worst item's grade. */
export const CONDITIONS = {
  new: "New",
  mint: "Mint",
  "near-mint": "Near mint",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
} as const;

export type Condition = keyof typeof CONDITIONS;

const CONDITION_RANK = Object.keys(CONDITIONS) as Condition[];

/** The worse of a list of conditions, e.g. ["new", "good"] → "good". */
export function worstCondition(conditions: Condition[]): Condition {
  return conditions.reduce(
    (worst, c) => (CONDITION_RANK.indexOf(c) > CONDITION_RANK.indexOf(worst) ? c : worst),
    "new",
  );
}

export interface Spec {
  label: string;
  value: string;
}
