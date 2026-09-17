export async function readFarmerOrderResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    console.error("Expected JSON from farmer order status API:", {
      url: response.url,
      status: response.status,
      body: text.slice(0, 300),
    });
    throw new Error(`Order update failed with server status ${response.status}`);
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Unable to read the order update response. Please try again.");
  }
  if (!response.ok)
    throw new Error(data?.error || data?.message || "Unable to update order");
  return data;
}
