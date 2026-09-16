import { createHash, randomUUID } from "node:crypto";
import {
  MAX_PRODUCT_IMAGES,
  MAX_PRODUCT_IMAGE_BYTES,
  PRODUCT_IMAGE_TYPES,
} from "./constants.js";
import { ProductError } from "./productErrors.js";
const FOLDER = "farmdirect/products";
function configuration() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME,
    apiKey = process.env.CLOUDINARY_API_KEY,
    apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (
    !cloudName ||
    !apiKey ||
    !apiSecret ||
    !/^[a-zA-Z0-9_-]+$/.test(cloudName)
  ) {
    console.error(
      "Cloudinary product image configuration is missing or invalid",
    );
    throw new ProductError("Image upload is temporarily unavailable", 503);
  }
  return { cloudName, apiKey, apiSecret };
}
export function cloudinarySignature(params, secret) {
  return createHash("sha1")
    .update(
      Object.keys(params)
        .sort()
        .map((key) => key + "=" + params[key])
        .join("&") + secret,
    )
    .digest("hex");
}
export function validateImageFiles(files) {
  if (files.length > MAX_PRODUCT_IMAGES)
    throw new ProductError("Use up to five product images", 400);
  for (const file of files) {
    if (
      typeof file?.arrayBuffer !== "function" ||
      !PRODUCT_IMAGE_TYPES.includes(file.type)
    )
      throw new ProductError("Use JPEG, PNG, or WebP images", 400);
    if (file.size === 0 || file.size > MAX_PRODUCT_IMAGE_BYTES)
      throw new ProductError("Each image must be between 1 byte and 5 MB", 400);
  }
}
export function isImageContent(buffer, type) {
  if (type === "image/jpeg")
    return (
      buffer.length >= 3 &&
      buffer[0] === 255 &&
      buffer[1] === 216 &&
      buffer[2] === 255
    );
  if (type === "image/png")
    return (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    );
  if (type === "image/webp")
    return (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  return false;
}
async function cloudinaryRequest(action, params, file) {
  const { cloudName, apiKey, apiSecret } = configuration();
  const fields = { ...params, timestamp: Math.floor(Date.now() / 1000) },
    body = new FormData();
  for (const [key, value] of Object.entries(fields))
    body.append(key, String(value));
  body.append("api_key", apiKey);
  body.append("signature", cloudinarySignature(fields, apiSecret));
  if (file) body.append("file", file, "produce");
  try {
    const response = await fetch(
      "https://api.cloudinary.com/v1_1/" + cloudName + "/image/" + action,
      { method: "POST", body, signal: AbortSignal.timeout(60000) },
    );
    const data = await response.json();
    if (!response.ok || data.error)
      throw new Error("Cloudinary request failed");
    return data;
  } catch {
    throw new ProductError(
      action === "upload"
        ? "Image upload failed. Please try again."
        : "Image cleanup failed",
      502,
    );
  }
}
export async function cleanupProductImages(images, ownerId) {
  if (!images.length) return false;
  const results = await Promise.allSettled(
    images.map(async (image) => {
      if (!image.publicId.startsWith(FOLDER + "/" + String(ownerId) + "/"))
        throw new Error("Unexpected asset owner");
      const result = await cloudinaryRequest("destroy", {
        public_id: image.publicId,
        invalidate: true,
      });
      if (!["ok", "not found"].includes(result.result))
        throw new Error("Image cleanup failed");
    }),
  );
  const failed = results.some((result) => result.status === "rejected");
  if (failed)
    console.warn(
      "Product image cleanup could not be completed; retry cleanup for the affected product assets.",
    );
  return failed;
}
export async function uploadProductImages(files, ownerId) {
  validateImageFiles(files);
  if (!files.length) return [];
  const buffers = await Promise.all(
    files.map((file) => file.arrayBuffer().then((value) => Buffer.from(value))),
  );
  for (let i = 0; i < files.length; i++)
    if (!isImageContent(buffers[i], files[i].type))
      throw new ProductError(
        "An image does not match its declared file type",
        400,
      );
  const uploaded = [];
  try {
    const { cloudName } = configuration();
    for (let i = 0; i < files.length; i++) {
      const publicId = String(ownerId) + "/" + randomUUID(),
        expected = FOLDER + "/" + publicId;
      const result = await cloudinaryRequest(
        "upload",
        { asset_folder: FOLDER, public_id: expected, overwrite: false },
        new Blob([buffers[i]], { type: files[i].type }),
      );
      if (
        result.public_id !== expected ||
        !result.secure_url?.startsWith(
          "https://res.cloudinary.com/" + cloudName + "/image/upload/",
        )
      )
        throw new ProductError("Image upload failed", 502);
      uploaded.push({ url: result.secure_url, publicId: result.public_id });
    }
    return uploaded;
  } catch (error) {
    await cleanupProductImages(uploaded, ownerId);
    throw error;
  }
}
