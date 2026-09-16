import { NextResponse } from "next/server";
import { connectDB, safeServerErrorMessage } from "@/lib/db";
import { registerSchema } from "@/validators/authValidator";
import { registerAccount } from "@/services/authService";
export async function POST(request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return NextResponse.json(
      { message: "Invalid request origin" },
      { status: 403 },
    );
  try {
    await connectDB();
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        {
          message: "Please check your details",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    const v = parsed.data;
    if (!(await registerAccount(v)))
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 },
      );
    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 },
    );
  } catch (error) {
    if (error.code === 11000)
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 },
      );
    if (error instanceof SyntaxError)
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 },
      );
    console.error("❌ Registration failed");
    if (process.env.NODE_ENV === "development") {
      console.error("Message: " + safeServerErrorMessage(error));
    } else {
      console.error("Type: " + error.name);
    }
    return NextResponse.json(
      {
        message:
          "Registration is temporarily unavailable. Please try again later.",
      },
      { status: 503 },
    );
  }
}
