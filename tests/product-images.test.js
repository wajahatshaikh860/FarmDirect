import test from "node:test";
import assert from "node:assert/strict";
import {
  uploadProductImages,
  cleanupProductImages,
  validateImageFiles,
  isImageContent,
} from "../lib/cloudinary.js";
import {
  readProductRequest,
  requireProductOrigin,
} from "../lib/productRequest.js";

const owner = "507f1f77bcf86cd799439011";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5f0AAAAASUVORK5CYII=",
  "base64",
);
const image = () => new File([png], "produce.png", { type: "image/png" });
function cloudEnv(t) {
  const values = {
    CLOUDINARY_CLOUD_NAME: "phase2-test",
    CLOUDINARY_API_KEY: "test-key",
    CLOUDINARY_API_SECRET: "test-secret",
  };
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, values);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}
test("Images reject excessive count, unsupported formats, oversized files and spoofed content", async () => {
  assert.throws(() => validateImageFiles(Array.from({ length: 6 }, image)), {
    status: 400,
  });
  assert.throws(
    () =>
      validateImageFiles([
        new File(["svg"], "image.svg", { type: "image/svg+xml" }),
      ]),
    { status: 400 },
  );
  assert.throws(
    () =>
      validateImageFiles([
        {
          type: "image/png",
          size: 6 * 1024 * 1024,
          arrayBuffer: async () => new ArrayBuffer(1),
        },
      ]),
    { status: 400 },
  );
  await assert.rejects(
    uploadProductImages(
      [new File(["not png"], "false.png", { type: "image/png" })],
      owner,
    ),
    { status: 400 },
  );
  assert.equal(isImageContent(png, "image/png"), true);
  assert.equal(isImageContent(png, "image/jpeg"), false);
});
test("Signed server upload stores only URL/publicId and never sends the secret as a field", async (t) => {
  cloudEnv(t);
  let body;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(
      url,
      "https://api.cloudinary.com/v1_1/phase2-test/image/upload",
    );
    body = options.body;
    return Response.json({
      public_id: body.get("public_id"),
      secure_url:
        "https://res.cloudinary.com/phase2-test/image/upload/v1/produce.png",
    });
  });
  const uploaded = await uploadProductImages([image()], owner);
  assert.deepEqual(Object.keys(uploaded[0]).sort(), ["publicId", "url"]);
  assert.ok(
    uploaded[0].publicId.startsWith("farmdirect/products/" + owner + "/"),
  );
  assert.equal(body.get("asset_folder"), "farmdirect/products");
  assert.equal(body.get("signature").length, 40);
  assert.equal(body.has("api_secret"), false);
});
test("Partial multi-image upload rolls back already uploaded assets", async (t) => {
  cloudEnv(t);
  let uploads = 0,
    destroyed = 0;
  t.mock.method(globalThis, "fetch", async (url, { body }) => {
    if (url.endsWith("/destroy")) {
      destroyed++;
      return Response.json({ result: "ok" });
    }
    uploads++;
    if (uploads === 2)
      return Response.json(
        { error: { message: "test-secret" } },
        { status: 500 },
      );
    return Response.json({
      public_id: body.get("public_id"),
      secure_url:
        "https://res.cloudinary.com/phase2-test/image/upload/v1/produce.png",
    });
  });
  await assert.rejects(
    uploadProductImages([image(), image()], owner),
    (error) => error.status === 502 && !error.message.includes("test-secret"),
  );
  assert.equal(destroyed, 1);
});
test("Image cleanup rejects assets belonging to another farmer and reports failures without throwing", async (t) => {
  cloudEnv(t);
  const fetch = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("test failure");
  });
  assert.equal(
    await cleanupProductImages(
      [{ publicId: "farmdirect/products/other/image" }],
      owner,
    ),
    true,
  );
  assert.equal(fetch.mock.callCount(), 0);
  assert.equal(
    await cleanupProductImages(
      [{ publicId: "farmdirect/products/" + owner + "/image" }],
      owner,
    ),
    true,
  );
});
test("Multipart input validates metadata, count and retained IDs without trusting image URL fields", async () => {
  const form = new FormData();
  form.append("data", JSON.stringify({ name: "Tomatoes" }));
  form.append("images", image());
  form.append("retainedImages", JSON.stringify(["existing-id"]));
  const result = await readProductRequest(
    new Request("http://localhost/api/products", {
      method: "POST",
      body: form,
    }),
  );
  assert.equal(result.files.length, 1);
  assert.deepEqual(result.retainedImages, ["existing-id"]);
  const invalid = new FormData();
  invalid.append("data", "{}");
  invalid.append("retainedImages", JSON.stringify(["same", "same"]));
  await assert.rejects(
    readProductRequest(
      new Request("http://localhost/api/products", {
        method: "POST",
        body: invalid,
      }),
    ),
    { status: 400 },
  );
});
test("Request parsing rejects oversized and malformed bodies and foreign origins", async () => {
  await assert.rejects(
    readProductRequest(
      new Request("http://localhost/api/products", {
        method: "POST",
        body: "{}",
        headers: {
          "content-type": "application/json",
          "content-length": String(28 * 1024 * 1024),
        },
      }),
    ),
    { status: 413 },
  );
  await assert.rejects(
    readProductRequest(
      new Request("http://localhost/api/products", {
        method: "POST",
        body: "{",
        headers: { "content-type": "application/json" },
      }),
    ),
    { status: 400 },
  );
  assert.throws(
    () =>
      requireProductOrigin(
        new Request("http://localhost/api/products", {
          headers: { origin: "https://foreign.example" },
        }),
      ),
    { status: 403 },
  );
  assert.doesNotThrow(() =>
    requireProductOrigin(
      new Request("http://localhost/api/products", {
        headers: { origin: "http://localhost" },
      }),
    ),
  );
});
