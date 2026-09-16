export const ROLES = ["FARMER", "BUYER", "ADMIN"];
export const dashboardFor = (role) =>
  `/${ROLES.includes(role) ? role.toLowerCase() : "buyer"}/dashboard`;

export const SIGNUP_ROLES = ["BUYER", "FARMER"];
export const FARMING_TYPES = ["Organic", "Conventional", "Mixed"];

// Phase 2 product types do not change existing registration farming types.
export const PRODUCT_CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Grains",
  "Pulses",
  "Spices",
  "Organic Produce",
  "Other",
];
export const PRODUCT_UNITS = ["KG", "QUINTAL", "TON", "PIECE"];
export const PRODUCT_GRADES = ["Grade A", "Grade B", "Grade C"];
export const PRODUCT_FARMING_TYPES = ["ORGANIC", "NATURAL", "CONVENTIONAL"];
export const PRODUCT_STATUSES = ["ACTIVE", "OUT_OF_STOCK", "DISABLED"];
export const PRODUCT_SORTS = ["newest", "price-asc", "price-desc"];
export const MAX_PRODUCT_IMAGES = 5;
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
