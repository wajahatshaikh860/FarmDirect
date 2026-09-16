import { NextResponse } from "next/server";
import { ProductError } from "./productErrors.js";
export function productErrorResponse(error) {
  if (error instanceof ProductError)
    return NextResponse.json(
      {
        message: error.message,
        ...(error.errors ? { errors: error.errors } : {}),
      },
      { status: error.status },
    );
  if (error?.name === "VersionError")
    return NextResponse.json(
      { message: "This product changed. Refresh and try again." },
      { status: 409 },
    );
  console.error("Product operation failed:", error?.name || "UnknownError");
  return NextResponse.json(
    { message: "Something went wrong. Please try again." },
    { status: 503 },
  );
}
