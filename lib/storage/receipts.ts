import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | undefined;

/** Neon Object Storage speaks S3; it needs path-style URLs. Created on first use. */
function s3() {
  return (client ??= new S3Client({
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    region: process.env.AWS_REGION ?? "auto",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }));
}

const bucket = () => process.env.S3_BUCKET!;

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

/** Allowed image types, identified by their first bytes (not the file name). */
const SIGNATURES: { type: string; ext: string; matches: (b: Uint8Array) => boolean }[] = [
  { type: "image/png", ext: "png", matches: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: "image/jpeg", ext: "jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: "image/webp",
    ext: "webp",
    matches: (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  },
];

/** The image type from the file's contents, or null if it isn't an allowed image. */
export function detectImageType(bytes: Uint8Array) {
  return SIGNATURES.find((s) => s.matches(bytes)) ?? null;
}

export async function putReceipt(key: string, body: Uint8Array, contentType: string) {
  await s3().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType }));
}

/** A private link that works for 10 minutes, for the admin to view a receipt. */
export function receiptViewUrl(key: string) {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn: 600 });
}
