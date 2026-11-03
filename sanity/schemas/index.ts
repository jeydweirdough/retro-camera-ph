import { faq } from "./faq";
import { paymentMethod } from "./payment-method";
import { accessory, bundle, camera, lens } from "./products";
import { promotion } from "./promotion";
import { storeSettings } from "./store-settings";

export const schemaTypes = [
  camera,
  lens,
  accessory,
  bundle,
  promotion,
  paymentMethod,
  faq,
  storeSettings,
];
