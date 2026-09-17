import test from "node:test";
import assert from "node:assert/strict";
import { readFarmerOrderResponse } from "../lib/farmerOrderResponse.js";

test("farmer status response accepts successful JSON", async () => {
  const order = { orderStatus: "CONFIRMED" };
  assert.deepEqual(await readFarmerOrderResponse(Response.json(order)), order);
});
for (const status of [404, 500, 200]) {
  test(`farmer status response handles HTML ${status} safely`, async (t) => {
    const log = t.mock.method(console, "error", () => {});
    await assert.rejects(
      readFarmerOrderResponse(new Response("<!DOCTYPE html><html>Login or error</html>", {
        status, headers: { "content-type": "text/html" },
      })),
      { message: `Order update failed with server status ${status}` },
    );
    assert.equal(log.mock.calls[0].arguments[1].status, status);
  });
}
test("farmer status response preserves safe JSON errors", async () => {
  for (const field of ["message", "error"])
    await assert.rejects(
      readFarmerOrderResponse(Response.json({ [field]: "Forbidden" }, { status: 403 })),
      { message: "Forbidden" },
    );
});
test("farmer status response handles malformed JSON safely", async () => {
  await assert.rejects(
    readFarmerOrderResponse(new Response("<html>", {
      headers: { "content-type": "application/json" },
    })),
    { message: "Unable to read the order update response. Please try again." },
  );
});
