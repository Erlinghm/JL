const test = require("node:test");
const assert = require("node:assert/strict");

const { createAuth } = require("../../lib/auth");

function withSupabaseEnv(run) {
  const previous = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  };

  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";

  return Promise.resolve()
    .then(run)
    .finally(() => {
      if (previous.SUPABASE_URL === undefined) {
        delete process.env.SUPABASE_URL;
      } else {
        process.env.SUPABASE_URL = previous.SUPABASE_URL;
      }

      if (previous.SUPABASE_PUBLISHABLE_KEY === undefined) {
        delete process.env.SUPABASE_PUBLISHABLE_KEY;
      } else {
        process.env.SUPABASE_PUBLISHABLE_KEY = previous.SUPABASE_PUBLISHABLE_KEY;
      }
    });
}

function createResponse() {
  const headers = new Map();

  return {
    locals: {},
    getHeader(name) {
      return headers.get(name);
    },
    setHeader(name, value) {
      headers.set(name, value);
    },
    headers,
  };
}

function createPrismaMock(existingUser = null) {
  const calls = {
    findUnique: [],
    create: [],
    update: [],
  };

  const prisma = {
    user: {
      findUnique: async (args) => {
        calls.findUnique.push(args);

        if (args.where.authUserId) {
          return existingUser?.authUserId === args.where.authUserId ? existingUser : null;
        }

        if (args.where.email) {
          return existingUser?.email === args.where.email ? existingUser : null;
        }

        return null;
      },
      create: async (args) => {
        calls.create.push(args);
        return {
          id: 1,
          ...args.data,
          profile: {},
        };
      },
      update: async (args) => {
        calls.update.push(args);
        return {
          id: existingUser?.id || 1,
          ...(existingUser || {}),
          ...args.data,
          profile: existingUser?.profile || {},
        };
      },
    },
  };

  return { prisma, calls };
}

function buildSession(user, overrides = {}) {
  return {
    access_token: "access-token",
    refresh_token: "refresh-token",
    expires_in: 3600,
    user,
    ...overrides,
  };
}

test("signInWithPassword persists long-lived session cookies without granting admin from metadata", async () => {
  await withSupabaseEnv(async () => {
    const authUser = {
      id: "auth-1",
      email: "Alice@example.com",
      phone: "+4712345678",
      app_metadata: { is_admin: true },
      user_metadata: { full_name: "Alice Example" },
    };
    const session = buildSession(authUser);
    const { prisma, calls } = createPrismaMock();
    const auth = createAuth({
      prisma,
      createSupabaseClient: () => ({
        auth: {
          signInWithPassword: async () => ({
            data: { user: authUser, session },
            error: null,
          }),
        },
      }),
    });
    const res = createResponse();

    const result = await auth.signInWithPassword({
      email: " Alice@example.com ",
      password: "supersecret",
      res,
    });

    const cookies = res.headers.get("Set-Cookie");
    assert.equal(cookies.length, 2);
    assert.match(cookies[0], /jl-access-token=access-token/);
    assert.match(cookies[1], /jl-refresh-token=refresh-token/);
    assert.match(cookies[0], /Max-Age=315360000/);
    assert.match(cookies[1], /Max-Age=315360000/);
    assert.match(cookies[0], /HttpOnly/);
    assert.match(cookies[0], /SameSite=Lax/);

    assert.equal(calls.create.length, 1);
    assert.equal(calls.create[0].data.email, "alice@example.com");
    assert.equal(calls.create[0].data.isAdmin, false);
    assert.equal(result.user.email, "alice@example.com");
  });
});

test("syncing an existing user preserves the Supabase is_admin column", async () => {
  await withSupabaseEnv(async () => {
    const authUser = {
      id: "auth-admin",
      email: "admin@example.com",
      app_metadata: {},
      user_metadata: { full_name: "Admin Example" },
    };
    const existingUser = {
      id: 42,
      authUserId: "auth-admin",
      email: "admin@example.com",
      fullName: "Admin Example",
      phone: null,
      isAdmin: true,
      profile: {},
    };
    const session = buildSession(authUser);
    const { prisma, calls } = createPrismaMock(existingUser);
    const auth = createAuth({
      prisma,
      createSupabaseClient: () => ({
        auth: {
          signInWithPassword: async () => ({
            data: { user: authUser, session },
            error: null,
          }),
        },
      }),
    });
    const res = createResponse();

    const result = await auth.signInWithPassword({
      email: "admin@example.com",
      password: "supersecret",
      res,
    });

    assert.equal(calls.update.length, 1);
    assert.equal(Object.hasOwn(calls.update[0].data, "isAdmin"), false);
    assert.equal(result.user.isAdmin, true);
    assert.equal(auth.isAdminUser(result.user, authUser), true);
  });
});

test("attachCurrentUser refreshes the Supabase session and exposes both auth and local users", async () => {
  await withSupabaseEnv(async () => {
    const authUser = {
      id: "auth-7",
      email: "ola@example.com",
      app_metadata: {},
      user_metadata: { full_name: "Ola Nordmann" },
    };
    const existingUser = {
      id: 7,
      authUserId: "auth-7",
      email: "ola@example.com",
      fullName: "Ola Nordmann",
      phone: null,
      isAdmin: false,
      profile: { county: null, bio: null },
    };
    const refreshedSession = buildSession(authUser, {
      access_token: "fresh-access-token",
      refresh_token: "fresh-refresh-token",
    });
    const { prisma, calls } = createPrismaMock(existingUser);
    const auth = createAuth({
      prisma,
      createSupabaseClient: () => ({
        auth: {
          setSession: async ({ access_token, refresh_token }) => {
            assert.equal(access_token, "stale-access-token");
            assert.equal(refresh_token, "stale-refresh-token");
            return {
              data: { session: refreshedSession },
              error: null,
            };
          },
          getUser: async () => ({
            data: { user: authUser },
            error: null,
          }),
        },
      }),
    });
    const req = {
      headers: {
        cookie: "jl-access-token=stale-access-token; jl-refresh-token=stale-refresh-token",
      },
    };
    const res = createResponse();

    await new Promise((resolve, reject) => {
      auth.attachCurrentUser(req, res, (error) => {
        if (error) return reject(error);
        return resolve();
      });
    });

    const cookies = res.headers.get("Set-Cookie");
    assert.equal(cookies.length, 2);
    assert.match(cookies[0], /jl-access-token=fresh-access-token/);
    assert.match(cookies[1], /jl-refresh-token=fresh-refresh-token/);
    assert.equal(req.currentUser.id, 7);
    assert.equal(req.authUser.id, "auth-7");
    assert.equal(res.locals.currentUser.id, 7);
    assert.equal(res.locals.authUser.id, "auth-7");
    assert.equal(res.locals.isAuthenticated, true);
    assert.equal(calls.update.length, 1);
  });
});

test("verifyOtp exchanges the token hash for a session and syncs the user", async () => {
  await withSupabaseEnv(async () => {
    const authUser = {
      id: "auth-9",
      email: "kari@example.com",
      app_metadata: {},
      user_metadata: { full_name: "Kari Hansen" },
    };
    const session = buildSession(authUser, {
      access_token: "otp-access-token",
      refresh_token: "otp-refresh-token",
    });
    const { prisma } = createPrismaMock();
    const auth = createAuth({
      prisma,
      createSupabaseClient: () => ({
        auth: {
          verifyOtp: async ({ token_hash, type }) => {
            assert.equal(token_hash, "token-hash");
            assert.equal(type, "email");
            return {
              data: { user: authUser, session },
              error: null,
            };
          },
        },
      }),
    });
    const res = createResponse();

    const result = await auth.verifyOtp({
      tokenHash: "token-hash",
      type: "email",
      res,
    });

    const cookies = res.headers.get("Set-Cookie");
    assert.equal(cookies.length, 2);
    assert.equal(result.requiresSignIn, false);
    assert.equal(result.user.email, "kari@example.com");
  });
});

test("isConfigured accepts NEXT_PUBLIC Supabase env vars as a fallback", async () => {
  const previous = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };

  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";

  try {
    const auth = createAuth({
      prisma: createPrismaMock().prisma,
      createSupabaseClient: () => {
        throw new Error("should not be called");
      },
    });

    assert.equal(auth.isConfigured(), true);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});
