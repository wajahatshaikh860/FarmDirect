export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}
export function productStatus(quantity, requestedStatus = "ACTIVE") {
  if (quantity === 0) return "OUT_OF_STOCK";
  return requestedStatus === "DISABLED" ? "DISABLED" : "ACTIVE";
}
export function unitLabel(unit) {
  return (unit || "KG").toLowerCase();
}
export function displayFarmingType(value) {
  return value
    ? value.charAt(0) + value.slice(1).toLowerCase()
    : "Not specified";
}
export function productLocation(location) {
  return [location?.village, location?.district, location?.state]
    .filter(Boolean)
    .join(", ");
}
