import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "./db.js";
import User from "../models/User.js";
import { authenticate } from "../services/authService.js";
export { authenticate } from "../services/authService.js";
export const authOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 },
  useSecureCookies: process.env.NODE_ENV === "production",
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider.default
      ? CredentialsProvider.default({
          name: "Credentials",
          credentials: { email: {}, password: {} },
          authorize: authenticate,
        })
      : CredentialsProvider({
          name: "Credentials",
          credentials: { email: {}, password: {} },
          authorize: authenticate,
        }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      await connectDB();
      const user = await User.findById(token.id);
      if (!user || user.accountStatus !== "ACTIVE")
        return { ...session, user: null };
      session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      return session;
    },
  },
};
