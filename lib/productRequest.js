import { ProductError, validationError } from "./productErrors.js";
import { retainedImagesSchema } from "../validators/productValidator.js";
import { validateImageFiles } from "./cloudinary.js";
const MAX_REQUEST_BYTES = 27 * 1024 * 1024;
export function requireProductOrigin(request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    throw new ProductError("Invalid request origin", 403);
}
async function limitedRequest(request) {
  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES)
    throw new ProductError("Product upload is too large", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ProductError("Invalid request body", 400);
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new ProductError("Product upload is too large", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new Request(request.url, {
    method: "POST",
    headers: { "content-type": request.headers.get("content-type") || "" },
    body: Buffer.concat(chunks),
  });
}
export async function readProductRequest(request) {
  try {
    const bounded = await limitedRequest(request);
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await bounded.formData();
      for (const key of form.keys())
        if (!["data", "images", "retainedImages"].includes(key))
          throw new ProductError("Unexpected product field", 400);
      if (
        form.getAll("data").length !== 1 ||
        form.getAll("retainedImages").length > 1
      )
        throw new ProductError("Invalid product body", 400);
      const fields = JSON.parse(form.get("data")),
        files = form.getAll("images");
      validateImageFiles(files);
      let retainedImages;
      if (form.has("retainedImages")) {
        const result = retainedImagesSchema.safeParse(
          JSON.parse(form.get("retainedImages")),
        );
        if (!result.success) throw validationError(result.error);
        retainedImages = result.data;
      }
      return { fields, files, retainedImages };
    }
    if (!request.headers.get("content-type")?.includes("application/json"))
      throw new ProductError("Use JSON or multipart form data", 415);
    return {
      fields: await bounded.json(),
      files: [],
      retainedImages: undefined,
    };
  } catch (error) {
    if (error instanceof ProductError) throw error;
    throw new ProductError("Invalid request body", 400);
  }
}
