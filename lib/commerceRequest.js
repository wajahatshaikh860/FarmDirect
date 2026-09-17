import { ProductError } from "./productErrors.js";
export async function readCommerceRequest(request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ProductError("Use JSON", 415);
  if (Number(request.headers.get("content-length")) > 16384)
    throw new ProductError("Request too large", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ProductError("Invalid request", 400);
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 16384) {
        await reader.cancel();
        throw new ProductError("Request too large", 413);
      }
      chunks.push(value);
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString());
    } catch {
      throw new ProductError("Invalid JSON", 400);
    }
  } finally {
    reader.releaseLock();
  }
}
