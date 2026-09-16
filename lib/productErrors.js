export class ProductError extends Error {
  constructor(message, status = 400, errors) {
    super(message);
    this.name = "ProductError";
    this.status = status;
    this.errors = errors;
  }
}
export function validationError(error) {
  const errors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    (errors[key] ??= []).push(issue.message);
  }
  return new ProductError("Please check your product details", 400, errors);
}
