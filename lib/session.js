const session = require("express-session");
const connectPgSimple = require("connect-pg-simple");
const { Pool } = require("pg");

const SESSION_COOKIE_NAME = "jl-session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24;
const DEVELOPMENT_SESSION_SECRET = "jordleie-local-development-session-secret";

function shouldUseSsl(databaseUrl) {
  if (!databaseUrl) return false;
  if (process.env.PGSSLMODE === "disable") return false;
  if (process.env.PGSSLMODE === "require") return true;
  return process.env.NODE_ENV === "production" || /supabase\.com|pooler\.supabase\.com/i.test(databaseUrl);
}

function buildPool(databaseUrl) {
  if (!databaseUrl) return null;

  const poolOptions = {
    connectionString: databaseUrl,
  };

  if (shouldUseSsl(databaseUrl)) {
    poolOptions.ssl = { rejectUnauthorized: false };
  }

  return new Pool(poolOptions);
}

function getSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }

  return DEVELOPMENT_SESSION_SECRET;
}

function createSessionStore(databaseUrl) {
  if (!databaseUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL is required for the production session store.");
    }

    return null;
  }

  const PgSession = connectPgSimple(session);
  return new PgSession({
    pool: buildPool(databaseUrl),
    tableName: "session",
  });
}

function createSessionMiddleware({
  databaseUrl = process.env.DATABASE_URL,
  secret = getSessionSecret(),
} = {}) {
  const store = createSessionStore(databaseUrl);

  return session({
    name: SESSION_COOKIE_NAME,
    secret,
    store: store || undefined,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE_MS,
    },
  });
}

module.exports = {
  createSessionMiddleware,
};
