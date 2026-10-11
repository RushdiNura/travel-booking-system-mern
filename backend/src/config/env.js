import dotenv from "dotenv";

dotenv.config();

const required = ["MONGODB_URI", "JWT_SECRET"];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  // Fail loudly at boot rather than limping along with undefined secrets.
  // eslint-disable-next-line no-console
  console.error(
    `\n[config] Missing required environment variables: ${missing.join(", ")}\n` +
      `Copy .env.example to .env and fill these in before starting the server.\n`,
  );
  process.exit(1);
}

const flag = (val) => Boolean(val && val.trim().length > 0);

// ── AI trip planner provider resolution ───────────────────────────────
// Provider is taken from AI_PROVIDER if set, otherwise guessed from the key
// prefix: sk-ant- → anthropic, gsk_ → groq, AIza / AQ. → gemini.
function aiConfig() {
  const apiKey = (process.env.AI_API_KEY || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
  const forced = (process.env.AI_PROVIDER || "").trim().toLowerCase();

  let provider = forced;
  if (!provider) {
    if (apiKey.startsWith("gsk_")) provider = "groq";
    else if (apiKey.startsWith("AIza") || apiKey.startsWith("AQ."))
      provider = "gemini";
    else if (process.env.AI_BASE_URL) provider = "openai";
    else provider = "anthropic";
  }

  const defaultModels = {
    anthropic: "claude-sonnet-5-5",
    groq: "llama-3.3-70b-versatile",
    gemini: "gemini-2.5-flash",
    openai: "gpt-4o-mini",
  };

  return {
    apiKey,
    provider,
    model: (
      process.env.AI_MODEL ||
      defaultModels[provider] ||
      defaultModels.anthropic
    ).trim(),
    baseUrl: (process.env.AI_BASE_URL || "").trim().replace(/\/$/, ""),
    configured: apiKey.length > 0,
  };
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  port: parseInt(process.env.PORT || "5000", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  mongodbUri: process.env.MONGODB_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  jwtCookieExpiresDays: parseInt(
    process.env.JWT_COOKIE_EXPIRES_DAYS || "7",
    10,
  ),

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
    configured: flag(process.env.STRIPE_SECRET_KEY),
  },

  email: {
    host: process.env.EMAIL_HOST || "",
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    user: process.env.EMAIL_USER || "",
    password: process.env.EMAIL_PASSWORD || "",
    from: process.env.EMAIL_FROM || "Aerlume Travel <no-reply@aerlume.com>",
    configured: flag(process.env.EMAIL_HOST) && flag(process.env.EMAIL_USER),
  },

  weather: {
    apiKey: process.env.WEATHER_API_KEY || "",
    configured: flag(process.env.WEATHER_API_KEY),
  },

  currency: {
    apiKey: process.env.CURRENCY_API_KEY || "",
    configured: flag(process.env.CURRENCY_API_KEY),
  },

  ai: aiConfig(),

  bookingHoldMinutes: parseInt(process.env.BOOKING_HOLD_MINUTES || "15", 10),

  rateLimit: {
    windowMinutes: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || "15", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "300", 10),
  },
};
