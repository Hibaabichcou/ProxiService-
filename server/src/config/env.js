const DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX = 100;
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

function parsePositiveInteger(value, name, fallback) {
  if (value === undefined || value === "") return fallback;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

function parsePort(value) {
  const port = parsePositiveInteger(value, "PORT", 3000);
  if (port > 65535) {
    throw new Error("PORT must be between 1 and 65535.");
  }
  return port;
}

function parseFrontendOrigins(value, nodeEnv) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("FRONTEND_ORIGINS must contain at least one allowed origin.");
  }

  const origins = value.split(",").map((entry) => entry.trim());
  if (origins.some((origin) => !origin || origin === "*")) {
    throw new Error("FRONTEND_ORIGINS must be a comma-separated list of exact origins.");
  }

  const validatedOrigins = origins.map((origin) => {
    let parsed;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(`Invalid frontend origin: ${origin}`);
    }

    if (
      !["http:", "https:"].includes(parsed.protocol)
      || parsed.origin !== origin
      || parsed.username
      || parsed.password
    ) {
      throw new Error(`Invalid frontend origin: ${origin}`);
    }
    if (nodeEnv === "production" && parsed.protocol !== "https:") {
      throw new Error("Production frontend origins must use HTTPS.");
    }
    return parsed.origin;
  });

  return [...new Set(validatedOrigins)];
}

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || "development";
  if (!["development", "test", "production"].includes(nodeEnv)) {
    throw new Error("NODE_ENV must be development, test, or production.");
  }

  const port = parsePort(env.PORT);
  const rateLimitWindowMs = parsePositiveInteger(
    env.RATE_LIMIT_WINDOW_MS,
    "RATE_LIMIT_WINDOW_MS",
    DEFAULT_RATE_LIMIT_WINDOW_MS,
  );
  const rateLimitMax = parsePositiveInteger(
    env.RATE_LIMIT_MAX,
    "RATE_LIMIT_MAX",
    DEFAULT_RATE_LIMIT_MAX,
  );
  const openaiApiKey = env.OPENAI_API_KEY?.trim() || "";
  if (nodeEnv === "production" && !openaiApiKey) {
    throw new Error("OPENAI_API_KEY must be set in production.");
  }

  return Object.freeze({
    nodeEnv,
    port,
    frontendOrigins: parseFrontendOrigins(env.FRONTEND_ORIGINS, nodeEnv),
    rateLimitWindowMs,
    rateLimitMax,
    openaiApiKey,
    openaiModel: env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
  });
}
