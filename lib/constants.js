export const ROLES = ["FARMER", "BUYER", "ADMIN"];
export const dashboardFor = (role) =>
  `/${ROLES.includes(role) ? role.toLowerCase() : "buyer"}/dashboard`;

export const SIGNUP_ROLES = ["BUYER", "FARMER"];
export const FARMING_TYPES = ["Organic", "Conventional", "Mixed"];
