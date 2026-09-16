import dns from "node:dns";
import mongoose from "mongoose";

// Force Node.js to use public DNS servers for MongoDB Atlas SRV resolution.
// This fixes local environments where the system DNS rejects SRV queries.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

console.log("🌐 Node DNS servers:", dns.getServers());

const cache = (globalThis.farmdirectMongo ??= {
  connection: null,
  promise: null,
});

// Driver messages can include connection URLs or credentials.
// Log only redacted/safe text.
export function safeServerErrorMessage(error) {
  let message = String(error?.message || "Unknown server error");

  const secrets = [
    process.env.MONGODB_URI,
    process.env.AUTH_SECRET,
    process.env.ADMIN_PASSWORD,
    process.env.ADMIN_EMAIL,
  ];

  try {
    const uri = new URL(process.env.MONGODB_URI);

    for (const value of [uri.username, uri.password]) {
      if (value) {
        secrets.push(value, decodeURIComponent(value));
      }
    }
  } catch {
    /* Missing or malformed URI is reported by connectDB. */
  }

  for (const secret of secrets
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)) {
    message = message.split(secret).join("[redacted]");
  }

  return message.replace(
    /mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi,
    "[MongoDB URI redacted]",
  );
}

export async function connectDB() {
  if (cache.connection) {
    return cache.connection;
  }

  if (!cache.promise) {
    console.log("⏳ Connecting to MongoDB...");

    cache.promise = Promise.resolve()
      .then(async () => {
        if (!process.env.MONGODB_URI) {
          throw new Error("MONGODB_URI is missing from .env.local");
        }

        // Verify that MongoDB Atlas SRV DNS can be resolved.
        try {
          const hostname = new URL(process.env.MONGODB_URI).hostname;

          if (process.env.MONGODB_URI.startsWith("mongodb+srv://")) {
            await dns.promises.resolveSrv(`_mongodb._tcp.${hostname}`);

            console.log("✅ MongoDB SRV DNS resolved successfully");
          }
        } catch (error) {
          console.error("❌ MongoDB SRV DNS resolution failed");
          console.error(
            "Reason: " + safeServerErrorMessage(error),
          );

          throw error;
        }

        return mongoose.connect(process.env.MONGODB_URI, {
          bufferCommands: false,
          serverSelectionTimeoutMS: 10000,
        });
      })
      .then((connection) => {
        cache.connection = connection;

        console.log("✅ MongoDB connected successfully");
        console.log(
          "📦 Database: " + connection.connection.name,
        );

        return connection;
      })
      .catch((error) => {
        cache.promise = null;

        console.error("❌ MongoDB connection failed");
        console.error(
          "Reason: " + safeServerErrorMessage(error),
        );

        throw error;
      });
  }

  return cache.promise;
}