const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const session = require("express-session");
const prismaClient = require("../prisma/client");
const { createApp, startServer } = require("../app");
const { createIndexRouter } = require("../routes/index");
const { createBankIdRedirect, createBankIdRouter } = require("../routes/bankid");
const { createFarmRouter } = require("../routes/farms");
const { createAdminRouter } = require("../routes/admin");

function withVerifiedIdentity(user) {
  return {
    ...user,
    verifications: [
      ...(user.verifications || []),
      {
        type: "IDENTITY",
        status: "VERIFIED",
      },
    ],
  };
}

function createAuthMock({
  currentUser = null,
  isConfigured = true,
  signUpResult = null,
  verifyOtpResult = null,
  onSignUp = null,
  onVerifyOtp = null,
} = {}) {
  function attachCurrentUser(req, res, next) {
    req.currentUser = currentUser;
    req.authUser = currentUser ? { id: `auth-${currentUser.id}`, email: currentUser.email } : null;
    res.locals.currentUser = currentUser;
    res.locals.authUser = req.authUser;
    res.locals.isAuthenticated = Boolean(currentUser);
    res.locals.identityVerified = hasVerifiedIdentity(currentUser);
    res.locals.authConfigured = isConfigured;
    next();
  }

  function requireAuth(req, res, next) {
    if (currentUser) return next();
    return res.redirect("/logg-inn?error=Du+m%C3%A5+logge+inn+for+%C3%A5+fortsette.&next=%2Fmin-bruker");
  }

  function isAdminUser(user, authUser) {
    return user?.isAdmin === true;
  }

  function hasVerifiedIdentity(user) {
    return Array.isArray(user?.verifications)
      && user.verifications.some((verification) => (
        verification.type === "IDENTITY"
        && verification.status === "VERIFIED"
      ));
  }

  function requireVerifiedIdentity(req, res, next) {
    if (!currentUser) return requireAuth(req, res, next);
    if (hasVerifiedIdentity(currentUser)) return next();
    return res.redirect(`/bankid/verifiser?next=${encodeURIComponent(req.verificationNextPath || req.originalUrl)}`);
  }

  function requireAdmin(req, res, next) {
    if (isAdminUser(req.currentUser, req.authUser)) return next();
    if (!req.currentUser) return res.redirect("/admin/logg-inn?error=Du+m%C3%A5+logge+inn+som+administrator.");
    return res.status(403).render("error", {
      title: "Ingen tilgang",
      message: "Du har ikke tilgang til admin-panelet.",
      hint: "Kontakt en administrator hvis du mener dette er feil.",
    });
  }

  function redirectIfAuthenticated(req, res, next) {
    if (!currentUser) return next();
    return res.redirect("/min-bruker");
  }

  return {
    attachCurrentUser,
    requireAuth,
    requireVerifiedIdentity,
    requireAdmin,
    isAdminUser,
    hasVerifiedIdentity,
    redirectIfAuthenticated,
    safeRedirect: (target, fallback = "/min-bruker") => {
      if (!target || typeof target !== "string") return fallback;
      if (!target.startsWith("/") || target.startsWith("//")) return fallback;
      return target;
    },
    signInWithPassword: async () => ({ user: currentUser }),
    signUpWithPassword: async (args) => {
      if (onSignUp) onSignUp(args);
      return signUpResult || { user: currentUser, requiresEmailConfirmation: false };
    },
    verifyOtp: async (args) => {
      if (onVerifyOtp) onVerifyOtp(args);
      return verifyOtpResult || { user: currentUser, requiresSignIn: false };
    },
    signOut: async () => {},
    isConfigured: () => isConfigured,
  };
}

function buildApp({ prisma, Farm, auth = createAuthMock(), bankIdRouter = null }) {
  const app = createApp({
    auth,
    sessionMiddleware: createTestSessionMiddleware(),
    indexRouter: createIndexRouter({ prisma, auth }),
    bankIdRouter: bankIdRouter || createBankIdRouter({ prisma, auth }),
    farmRouter: createFarmRouter({ Farm, auth }),
    adminRouter: createAdminRouter({ Farm, auth }),
  });

  app.response.render = function render(view, locals = {}) {
    return this.json({ view, locals });
  };

  return app;
}

function createTestSessionMiddleware() {
  return session({
    secret: "test-session-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
    },
  });
}

async function startApp(app) {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const origin = `http://127.0.0.1:${server.address().port}`;

  async function request(path, init = {}) {
    const response = await fetch(new URL(path, origin), {
      redirect: "manual",
      ...init,
    });

    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    return { response, body };
  }

  async function close() {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  return { request, close, origin };
}

function postForm(path, data) {
  return {
    path,
    init: {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(data).toString(),
    },
  };
}

function createPrismaMock() {
  return {
    contactSubmission: {
      create: async () => {},
    },
  };
}

function createBankIdEnv() {
  return {
    IDURA_DOMAIN: "test.idura.example",
    IDURA_CLIENT_ID: "urn:test:client",
    IDURA_CLIENT_SECRET: "secret",
    IDURA_ACR_VALUES: "urn:grn:authn:no:bankid",
  };
}

function createBankIdRedirectMock(claims) {
  return {
    middleware: () => (req, res, next) => {
      req.claims = claims;
      next();
    },
  };
}

test("createBankIdRedirect includes configured BankID app login hint", () => {
  const redirect = createBankIdRedirect({
    domain: "test.idura.example",
    clientID: "urn:test:client",
    clientSecret: "secret",
    acrValues: "urn:grn:authn:no:bankid:substantial",
    loginHint: "BIS",
  });

  const options = redirect.options.beforeAuthorize({}, { scope: "openid" });

  assert.deepEqual(options, {
    scope: "openid",
    acr_values: "urn:grn:authn:no:bankid:substantial",
    login_hint: "BIS",
  });
});

function createFarmMock() {
  return {
    find: async () => [],
    findById: async () => null,
    create: async () => ({ id: 1 }),
    update: async () => ({ id: 1 }),
    deleteById: async () => {},
    updateBid: async () => {},
  };
}

test("unknown routes render the shared 404 page", async () => {
  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm: createFarmMock(),
  }));

  try {
    const { response, body } = await client.request("/finnes-ikke");
    assert.equal(response.status, 404);
    assert.equal(body.view, "404");
    assert.equal(body.locals.title, "Side ikke funnet");
  } finally {
    await client.close();
  }
});

test("startServer creates an app, logs the port, registers signal handlers, and shuts down Prisma", async () => {
  const originalOn = process.on;
  const originalExit = process.exit;
  const originalLog = console.log;
  const originalDisconnect = prismaClient.$disconnect;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalSessionSecret = process.env.SESSION_SECRET;
  const registeredSignals = [];
  const logs = [];
  const exits = [];

  process.on = (signal, handler) => {
    registeredSignals.push({ signal, handler });
    return process;
  };
  process.exit = (code) => {
    exits.push(code);
  };
  console.log = (message) => {
    logs.push(message);
  };
  prismaClient.$disconnect = async () => {};
  process.env.NODE_ENV = "test";
  delete process.env.DATABASE_URL;
  delete process.env.SESSION_SECRET;

  try {
    const { app, server, shutdown } = startServer({ port: 0 });
    assert.ok(app);
    assert.ok(server.listening);
    assert.deepEqual(registeredSignals.map((entry) => entry.signal), ["SIGINT", "SIGTERM"]);
    await new Promise((resolve) => setTimeout(resolve, 10));

    await shutdown();
    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.equal(logs.length, 1);
    assert.match(logs[0], /localhost:0/);
    assert.deepEqual(exits, [0]);
  } finally {
    process.on = originalOn;
    process.exit = originalExit;
    console.log = originalLog;
    prismaClient.$disconnect = originalDisconnect;
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    if (originalSessionSecret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = originalSessionSecret;
    }
  }
});

test("static pages and login/profile routes render the expected views", async (t) => {
  const currentUser = withVerifiedIdentity({
    id: 1,
    email: "bonde@example.com",
    fullName: "Bonde Bruker",
    role: "BOTH",
    status: "ACTIVE",
    phone: null,
    createdAt: new Date("2026-04-09T10:00:00Z"),
    profile: {
      county: "Innlandet",
      bio: "Driver gård.",
    },
  });
  const publicClient = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm: createFarmMock(),
    auth: createAuthMock({ currentUser: null }),
  }));
  const privateClient = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm: createFarmMock(),
    auth: createAuthMock({ currentUser }),
  }));

  try {
    const publicCases = [
      ["/", "landing", "Jordleie.no – Fremtidens jordleie"],
      ["/om-jordleie", "about", "Om Jordleie.no"],
      ["/hvordan-kjope-selge", "how-it-works", "Hvordan kjøpe og selge"],
      ["/artikler", "articles", "Artikler"],
      ["/logg-inn", "login", "Logg inn – Jordleie.no"],
      ["/registrer-deg", "login", "Registrer deg – Jordleie.no"],
    ];
    const privateCases = [
      ["/min-bruker", "my-profile", "Min bruker"],
      ["/lag-annonse", "create-listing", "Lag annonse"],
    ];

    for (const [path, view, title] of publicCases) {
      await t.test(path, async () => {
        const { response, body } = await publicClient.request(path);
        assert.equal(response.status, 200);
        assert.equal(body.view, view);
        assert.equal(body.locals.title, title);
      });
    }

    for (const [path, view, title] of privateCases) {
      await t.test(path, async () => {
        const { response, body } = await privateClient.request(path);
        assert.equal(response.status, 200);
        assert.equal(body.view, view);
        assert.equal(body.locals.title, title);
      });
    }
  } finally {
    await publicClient.close();
    await privateClient.close();
  }
});

test("protected profile routes redirect unauthenticated users to login", async (t) => {
  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm: createFarmMock(),
    auth: createAuthMock({ currentUser: null }),
  }));

  try {
    const cases = ["/min-bruker", "/lag-annonse"];

    for (const path of cases) {
      await t.test(path, async () => {
        const { response } = await client.request(path);
        assert.equal(response.status, 302);
        assert.match(response.headers.get("location"), /^\/logg-inn\?/);
      });
    }
  } finally {
    await client.close();
  }
});

test("GET /lag-annonse redirects logged-in unverified users to BankID", async () => {
  const currentUser = {
    id: 11,
    email: "unverified@example.com",
    fullName: "Uverifisert Bruker",
    role: "BOTH",
    status: "ACTIVE",
    createdAt: new Date("2026-04-09T10:00:00Z"),
    profile: {},
    verifications: [],
  };
  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm: createFarmMock(),
    auth: createAuthMock({ currentUser }),
  }));

  try {
    const { response } = await client.request("/lag-annonse");
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/bankid/verifiser?next=%2Flag-annonse");
  } finally {
    await client.close();
  }
});

test("GET /bankid/verifiser stores a verified identity from Idura claims", async () => {
  const calls = [];
  const prisma = createPrismaMock();
  prisma.userVerification = {
    findFirst: async (args) => {
      calls.push(["findFirst", args]);
      return null;
    },
    upsert: async (args) => {
      calls.push(["upsert", args]);
      return { id: 1, ...args.create };
    },
  };
  const currentUser = {
    id: 21,
    email: "bankid@example.com",
    fullName: "BankID Bruker",
    role: "BOTH",
    status: "ACTIVE",
    createdAt: new Date("2026-04-09T10:00:00Z"),
    profile: {},
    verifications: [],
  };
  const auth = createAuthMock({ currentUser });
  const bankIdRouter = createBankIdRouter({
    prisma,
    auth,
    env: createBankIdEnv(),
    bankIdRedirect: createBankIdRedirectMock({
      sub: "idura-subject-1",
      authenticationtype: "urn:grn:authn:no:bankid",
    }),
  });
  const client = await startApp(buildApp({
    prisma,
    Farm: createFarmMock(),
    auth,
    bankIdRouter,
  }));

  try {
    const { response } = await client.request("/bankid/verifiser?code=abc&next=%2Flag-annonse");
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/lag-annonse?success=BankID-verifisering+er+fullf%C3%B8rt.");
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], ["findFirst", {
      where: {
        provider: "IDURA_VERIFY",
        providerSubject: "idura-subject-1",
        NOT: {
          userId: 21,
        },
      },
      select: {
        id: true,
      },
    }]);
    assert.equal(calls[1][0], "upsert");
    assert.deepEqual(calls[1][1].where, {
      userId_type: {
        userId: 21,
        type: "IDENTITY",
      },
    });
    assert.equal(calls[1][1].create.status, "VERIFIED");
    assert.equal(calls[1][1].create.provider, "IDURA_VERIFY");
    assert.equal(calls[1][1].create.providerSubject, "idura-subject-1");
    assert.equal(calls[1][1].create.acr, "urn:grn:authn:no:bankid");
    assert.ok(calls[1][1].create.verifiedAt instanceof Date);
  } finally {
    await client.close();
  }
});

test("GET /bankid/verifiser rejects callbacks without an Idura subject", async () => {
  const prisma = createPrismaMock();
  prisma.userVerification = {
    findFirst: async () => {
      throw new Error("should not query without subject");
    },
    upsert: async () => {
      throw new Error("should not upsert without subject");
    },
  };
  const currentUser = {
    id: 22,
    email: "missing-subject@example.com",
    fullName: "Missing Subject",
    role: "BOTH",
    status: "ACTIVE",
    createdAt: new Date("2026-04-09T10:00:00Z"),
    profile: {},
    verifications: [],
  };
  const auth = createAuthMock({ currentUser });
  const bankIdRouter = createBankIdRouter({
    prisma,
    auth,
    env: createBankIdEnv(),
    bankIdRedirect: createBankIdRedirectMock({
      authenticationtype: "urn:grn:authn:no:bankid",
    }),
  });
  const client = await startApp(buildApp({
    prisma,
    Farm: createFarmMock(),
    auth,
    bankIdRouter,
  }));

  try {
    const { response } = await client.request("/bankid/verifiser?code=abc&next=%2Flag-annonse");
    assert.equal(response.status, 302);
    assert.match(
      response.headers.get("location"),
      /^\/min-bruker\?error=BankID-verifiseringen\+mangler\+en\+gyldig\+brukeridentitet\./
    );
  } finally {
    await client.close();
  }
});

test("GET /bankid/verifiser rejects a BankID identity already linked to another user", async () => {
  const prisma = createPrismaMock();
  let upsertCalls = 0;
  prisma.userVerification = {
    findFirst: async () => ({ id: 99 }),
    upsert: async () => {
      upsertCalls += 1;
    },
  };
  const currentUser = {
    id: 23,
    email: "duplicate@example.com",
    fullName: "Duplicate Identity",
    role: "BOTH",
    status: "ACTIVE",
    createdAt: new Date("2026-04-09T10:00:00Z"),
    profile: {},
    verifications: [],
  };
  const auth = createAuthMock({ currentUser });
  const bankIdRouter = createBankIdRouter({
    prisma,
    auth,
    env: createBankIdEnv(),
    bankIdRedirect: createBankIdRedirectMock({
      sub: "already-linked-subject",
    }),
  });
  const client = await startApp(buildApp({
    prisma,
    Farm: createFarmMock(),
    auth,
    bankIdRouter,
  }));

  try {
    const { response } = await client.request("/bankid/verifiser?code=abc&next=%2Flag-annonse");
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("location"),
      "/min-bruker?error=Denne+BankID-en+er+allerede+knyttet+til+en+annen+bruker."
    );
    assert.equal(upsertCalls, 0);
  } finally {
    await client.close();
  }
});

test("GET /bankid/verifiser falls back when next is unsafe", async () => {
  const prisma = createPrismaMock();
  prisma.userVerification = {
    findFirst: async () => null,
    upsert: async (args) => ({ id: 1, ...args.create }),
  };
  const currentUser = {
    id: 24,
    email: "safe-next@example.com",
    fullName: "Safe Next",
    role: "BOTH",
    status: "ACTIVE",
    createdAt: new Date("2026-04-09T10:00:00Z"),
    profile: {},
    verifications: [],
  };
  const auth = createAuthMock({ currentUser });
  const bankIdRouter = createBankIdRouter({
    prisma,
    auth,
    env: createBankIdEnv(),
    bankIdRedirect: createBankIdRedirectMock({
      sub: "safe-next-subject",
    }),
  });
  const client = await startApp(buildApp({
    prisma,
    Farm: createFarmMock(),
    auth,
    bankIdRouter,
  }));

  try {
    const { response } = await client.request("/bankid/verifiser?code=abc&next=https%3A%2F%2Fevil.example");
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/min-bruker?success=BankID-verifisering+er+fullf%C3%B8rt.");
  } finally {
    await client.close();
  }
});

test("admin routes require an administrator", async () => {
  const anonymousClient = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm: createFarmMock(),
    auth: createAuthMock({ currentUser: null }),
  }));
  const regularClient = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm: createFarmMock(),
    auth: createAuthMock({
      currentUser: {
        id: 2,
        email: "ola@example.com",
        fullName: "Ola",
        role: "BOTH",
        isAdmin: false,
      },
    }),
  }));
  const roleOnlyClient = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm: createFarmMock(),
    auth: createAuthMock({
      currentUser: {
        id: 3,
        email: "role-admin@example.com",
        fullName: "Role Admin",
        role: "ADMIN",
        isAdmin: false,
      },
    }),
  }));

  try {
    const anonymous = await anonymousClient.request("/admin/dashboard");
    assert.equal(anonymous.response.status, 302);
    assert.match(anonymous.response.headers.get("location"), /^\/admin\/logg-inn\?/);

    const regular = await regularClient.request("/admin/dashboard");
    assert.equal(regular.response.status, 403);
    assert.equal(regular.body.view, "error");
    assert.equal(regular.body.locals.message, "Du har ikke tilgang til admin-panelet.");

    const roleOnly = await roleOnlyClient.request("/admin/dashboard");
    assert.equal(roleOnly.response.status, 403);
    assert.equal(roleOnly.body.view, "error");
    assert.equal(roleOnly.body.locals.message, "Du har ikke tilgang til admin-panelet.");
  } finally {
    await anonymousClient.close();
    await regularClient.close();
    await roleOnlyClient.close();
  }
});

test("admin dashboard renders listings for admins", async () => {
  const Farm = createFarmMock();
  Farm.find = async () => [
    { id: 1, title: "Eldre annonse", fylke: "Vestland", status: "aktiv", auctionStart: new Date("2026-04-01"), auctionEnd: new Date("2026-04-20") },
    { id: 2, title: "Ny annonse", fylke: "Innlandet", status: "kommende", auctionStart: new Date("2026-05-01"), auctionEnd: new Date("2026-05-20") },
  ];

  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm,
    auth: createAuthMock({
      currentUser: {
        id: 1,
        email: "admin@example.com",
        fullName: "Admin",
        role: "ADMIN",
        isAdmin: true,
      },
    }),
  }));

  try {
    const { response, body } = await client.request("/admin/dashboard");
    assert.equal(response.status, 200);
    assert.equal(body.view, "admin/dashboard");
    assert.equal(body.locals.title, "Admin-panel - Jordleie.no");
    assert.deepEqual(body.locals.farms.map((farm) => farm.title), ["Ny annonse", "Eldre annonse"]);
  } finally {
    await client.close();
  }
});

test("admin create route normalizes form input without reusing the admin as owner", async () => {
  const Farm = createFarmMock();
  const calls = [];
  Farm.create = async (input) => {
    calls.push(input);
    return { id: 20 };
  };

  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm,
    auth: createAuthMock({
      currentUser: {
        id: 1,
        email: "admin@example.com",
        fullName: "Admin",
        role: "ADMIN",
        isAdmin: true,
      },
    }),
  }));

  try {
    const { path, init } = postForm("/admin/annonser", {
      title: "Admin annonse",
      description: "Beskrivelse",
      ownerName: "Gård Eier",
      ownerDescription: "",
      municipality: "Råde",
      fylke: "Østfold",
      address: "",
      sizeDekar: "80.5",
      soilType: "",
      soilQuality: "",
      auctionStart: "2026-05-01",
      auctionEnd: "2026-05-20",
      startingBid: "600",
      rentalPeriodYears: "",
      status: "aktiv",
    });

    const { response } = await client.request(path, init);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/admin/dashboard");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].ownerUserId, undefined);
    assert.equal(calls[0].ownerName, "Gård Eier");
    assert.equal(calls[0].sizeDekar, 80.5);
    assert.equal(calls[0].soilType, "Leirjord");
    assert.equal(calls[0].soilQuality, "God");
    assert.equal(calls[0].rentalPeriodYears, 5);
  } finally {
    await client.close();
  }
});

test("admin edit and delete routes call the farm model", async () => {
  const Farm = createFarmMock();
  const calls = [];
  Farm.findById = async (id) => ({
    id: Number(id),
    title: "Admin annonse",
    ownerName: "Eier",
    description: "Beskrivelse",
    municipality: "Råde",
    fylke: "Østfold",
    address: null,
    sizeDekar: 80,
    soilType: "Leirjord",
    soilQuality: "God",
    auctionStart: new Date("2026-05-01"),
    auctionEnd: new Date("2026-05-20"),
    startingBid: 600,
    rentalPeriodYears: 5,
    status: "aktiv",
  });
  Farm.update = async (id, input) => {
    calls.push(["update", id, input]);
    return { id: Number(id) };
  };
  Farm.deleteById = async (id) => {
    calls.push(["delete", id]);
  };

  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm,
    auth: createAuthMock({
      currentUser: {
        id: 1,
        email: "admin@example.com",
        fullName: "Admin",
        role: "ADMIN",
        isAdmin: true,
      },
    }),
  }));

  try {
    const edit = await client.request("/admin/annonser/7/rediger");
    assert.equal(edit.response.status, 200);
    assert.equal(edit.body.view, "admin/edit");
    assert.equal(edit.body.locals.farm.id, 7);

    const update = await client.request("/admin/annonser/7", {
      method: "PUT",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        title: "Oppdatert",
        description: "Beskrivelse",
        ownerName: "Eier",
        municipality: "Råde",
        fylke: "Østfold",
        sizeDekar: "90",
        auctionStart: "2026-05-01",
        auctionEnd: "2026-05-20",
        startingBid: "700",
        rentalPeriodYears: "6",
        status: "kommende",
      }).toString(),
    });
    assert.equal(update.response.status, 302);
    assert.equal(update.response.headers.get("location"), "/admin/dashboard");

    const deleted = await client.request("/admin/annonser/7", { method: "DELETE" });
    assert.equal(deleted.response.status, 302);
    assert.equal(deleted.response.headers.get("location"), "/admin/dashboard");

    assert.equal(calls.length, 2);
    assert.equal(calls[0][0], "update");
    assert.equal(calls[0][1], "7");
    assert.equal(calls[0][2].title, "Oppdatert");
    assert.equal(calls[0][2].rentalPeriodYears, 6);
    assert.equal(calls[0][2].fieldPolygon, undefined);
    assert.deepEqual(calls[1], ["delete", "7"]);
  } finally {
    await client.close();
  }
});

test("POST /auth/registrer-deg passes an SSR confirmation URL to Supabase", async () => {
  let capturedArgs = null;
  const auth = createAuthMock({
    signUpResult: { user: null, requiresEmailConfirmation: true },
    onSignUp: (args) => {
      capturedArgs = args;
    },
  });
  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm: createFarmMock(),
    auth,
  }));

  try {
    const { path, init } = postForm("/auth/registrer-deg", {
      fullName: "Ola Nordmann",
      email: "ola@example.com",
      password: "supersecret",
      confirmPassword: "supersecret",
      next: "/auksjoner/2",
    });

    const { response } = await client.request(path, init);
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("location"),
      "/logg-inn?success=Kontoen+er+opprettet.+Bekreft+e-posten+din+og+logg+inn.&next=%2Fauksjoner%2F2"
    );
    assert.ok(capturedArgs);
    assert.equal(capturedArgs.emailRedirectTo, `${client.origin}/auth/confirm?next=%2Fauksjoner%2F2`);
  } finally {
    await client.close();
  }
});

test("GET /auth/confirm rejects incomplete confirmation links", async () => {
  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm: createFarmMock(),
  }));

  try {
    const { response } = await client.request("/auth/confirm?next=%2Fauksjoner%2F2");
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("location"),
      "/logg-inn?error=Bekreftelseslenken+er+ugyldig+eller+mangler+data.&next=%2Fauksjoner%2F2"
    );
  } finally {
    await client.close();
  }
});

test("GET /auth/confirm verifies the token and redirects to the requested page", async () => {
  const calls = [];
  const auth = createAuthMock({
    currentUser: {
      id: 4,
      email: "ola@example.com",
      fullName: "Ola Nordmann",
    },
    verifyOtpResult: {
      user: { id: 4, email: "ola@example.com", fullName: "Ola Nordmann" },
      requiresSignIn: false,
    },
    onVerifyOtp: (args) => {
      calls.push({ tokenHash: args.tokenHash, type: args.type });
    },
  });
  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm: createFarmMock(),
    auth,
  }));

  try {
    const { response } = await client.request("/auth/confirm?token_hash=abc123&type=email&next=%2Fauksjoner%2F2");
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("location"),
      "/auksjoner/2?success=E-posten+er+bekreftet.+Du+er+n%C3%A5+logget+inn."
    );
    assert.deepEqual(calls, [{ tokenHash: "abc123", type: "email" }]);
  } finally {
    await client.close();
  }
});

test("GET /kontakt maps the sendt query string to a boolean", async () => {
  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm: createFarmMock(),
  }));

  try {
    const sent = await client.request("/kontakt?sendt=true");
    assert.equal(sent.response.status, 200);
    assert.equal(sent.body.view, "contact");
    assert.equal(sent.body.locals.sendt, true);

    const unsent = await client.request("/kontakt");
    assert.equal(unsent.response.status, 200);
    assert.equal(unsent.body.locals.sendt, false);
  } finally {
    await client.close();
  }
});

test("POST /kontakt validates required fields before touching the database", async () => {
  const prisma = createPrismaMock();
  let createCalls = 0;
  prisma.contactSubmission.create = async () => {
    createCalls += 1;
  };

  const client = await startApp(buildApp({
    prisma,
    Farm: createFarmMock(),
  }));

  try {
    const { path, init } = postForm("/kontakt", {
      name: "  Ola  ",
      email: "",
      message: "",
    });

    const { response, body } = await client.request(path, init);
    assert.equal(response.status, 400);
    assert.equal(body.view, "error");
    assert.equal(body.locals.message, "Navn, e-post og melding er påkrevd.");
    assert.equal(createCalls, 0);
  } finally {
    await client.close();
  }
});

test("POST /kontakt stores trimmed form data and redirects on success", async () => {
  const prisma = createPrismaMock();
  const calls = [];
  prisma.contactSubmission.create = async (input) => {
    calls.push(input);
  };

  const client = await startApp(buildApp({
    prisma,
    Farm: createFarmMock(),
  }));

  try {
    const { path, init } = postForm("/kontakt", {
      name: "  Ola Nordmann  ",
      email: "  ola@example.com ",
      subject: "  Hei  ",
      message: "  Kan dere hjelpe?  ",
    });

    const { response } = await client.request(path, init);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/kontakt?sendt=true");
    assert.deepEqual(calls, [{
      data: {
        name: "Ola Nordmann",
        email: "ola@example.com",
        subject: "Hei",
        message: "Kan dere hjelpe?",
      },
    }]);
  } finally {
    await client.close();
  }
});

test("POST /kontakt renders the error page when persistence fails", async () => {
  const prisma = createPrismaMock();
  prisma.contactSubmission.create = async () => {
    throw new Error("database offline");
  };

  const client = await startApp(buildApp({
    prisma,
    Farm: createFarmMock(),
  }));

  try {
    const { path, init } = postForm("/kontakt", {
      name: "Ola",
      email: "ola@example.com",
      message: "Hei",
    });

    const { response, body } = await client.request(path, init);
    assert.equal(response.status, 500);
    assert.equal(body.view, "error");
    assert.equal(body.locals.message, "Kunne ikke sende meldingen.");
    assert.equal(body.locals.hint, "database offline");
  } finally {
    await client.close();
  }
});

test("GET /auksjoner renders filtered auctions with marketplace stats", async () => {
  const Farm = createFarmMock();
  const calls = [];
  Farm.find = async (filter) => {
    calls.push(filter);
    if (filter.fylke) {
      return [{
        _id: 2,
        title: "Vestlandsgård",
        description: "Grønnsaksjord",
        municipality: "Kvam",
        fylke: "Vestland",
        sizeDekar: 50,
        soilType: "Sandjord",
        cropTypes: ["bær"],
        startingBid: 500,
        currentBid: 0,
        rentalPeriodYears: 3,
        status: "aktiv",
        auctionEnd: new Date("2026-04-10"),
        lat: 60,
        lng: 6,
        fieldPolygon: [],
      }];
    }

    return [
      {
        _id: 1,
        title: "Østfold gård",
        description: "Kornjord",
        municipality: "Råde",
        fylke: "Østfold",
        sizeDekar: 100,
        soilType: "Leirjord",
        cropTypes: ["hvete"],
        startingBid: 650,
        currentBid: 700,
        rentalPeriodYears: 5,
        status: "aktiv",
        auctionEnd: new Date("2026-04-10"),
        lat: 59.3,
        lng: 10.8,
        fieldPolygon: [],
      },
      {
        _id: 2,
        title: "Vestlandsgård",
        description: "Grønnsaksjord",
        municipality: "Kvam",
        fylke: "Vestland",
        sizeDekar: 50,
        soilType: "Sandjord",
        cropTypes: ["bær"],
        startingBid: 500,
        currentBid: 0,
        rentalPeriodYears: 3,
        status: "aktiv",
        auctionEnd: new Date("2026-04-10"),
        lat: 60,
        lng: 6,
        fieldPolygon: [],
      },
    ];
  };

  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm,
  }));

  try {
    const { response, body } = await client.request("/auksjoner?fylke=Vestland");
    assert.equal(response.status, 200);
    assert.equal(body.view, "auctions");
    assert.deepEqual(calls, [{ fylke: "Vestland" }, {}]);
    assert.equal(body.locals.totalAuctions, 2);
    assert.equal(body.locals.avgDekar, 75);
    assert.equal(body.locals.avgBidPerDekar, 575);
    assert.deepEqual(body.locals.allFylker, ["Vestland", "Østfold"]);
    assert.equal(body.locals.selectedFylke, "Vestland");
    assert.equal(body.locals.farms.length, 1);
  } finally {
    await client.close();
  }
});

test("GET /auksjoner surfaces Prisma-style connectivity errors with a setup hint", async () => {
  const Farm = createFarmMock();
  Farm.find = async () => {
    const error = new Error("prisma blew up");
    error.code = "P1001";
    throw error;
  };

  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm,
  }));

  try {
    const { response, body } = await client.request("/auksjoner");
    assert.equal(response.status, 500);
    assert.equal(body.view, "error");
    assert.match(body.locals.hint, /DATABASE_URL/);
  } finally {
    await client.close();
  }
});

test("GET /auksjoner surfaces non-Prisma errors directly", async () => {
  const Farm = createFarmMock();
  Farm.find = async () => {
    throw new Error("custom failure");
  };

  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm,
  }));

  try {
    const { response, body } = await client.request("/auksjoner");
    assert.equal(response.status, 500);
    assert.equal(body.view, "error");
    assert.equal(body.locals.hint, "custom failure");
  } finally {
    await client.close();
  }
});

test("GET /auksjoner/:id renders the selected auction", async () => {
  const Farm = createFarmMock();
  const calls = [];
  Farm.findById = async (id) => {
    calls.push(id);
    return { id: 7, title: "Testgård" };
  };

  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm,
  }));

  try {
    const { response, body } = await client.request("/auksjoner/7");
    assert.equal(response.status, 200);
    assert.equal(body.view, "farm");
    assert.equal(body.locals.title, "Testgård – Jordleie.no");
    assert.equal(body.locals.farm.id, 7);
    assert.deepEqual(calls, ["7"]);
  } finally {
    await client.close();
  }
});

test("GET /auksjoner/:id returns 404 when the auction is missing", async () => {
  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm: createFarmMock(),
  }));

  try {
    const { response, body } = await client.request("/auksjoner/999");
    assert.equal(response.status, 404);
    assert.equal(body.view, "404");
    assert.equal(body.locals.title, "Ikke funnet");
  } finally {
    await client.close();
  }
});

test("GET /auksjoner/:id renders the shared error view on unexpected failures", async () => {
  const Farm = createFarmMock();
  Farm.findById = async () => {
    throw new Error("lookup failed");
  };

  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm,
  }));

  try {
    const { response, body } = await client.request("/auksjoner/7");
    assert.equal(response.status, 500);
    assert.equal(body.view, "error");
    assert.equal(body.locals.message, "Kunne ikke hente gårdsannonsen.");
    assert.equal(body.locals.hint, "lookup failed");
  } finally {
    await client.close();
  }
});

test("POST /auksjoner normalizes form input before creating a listing", async () => {
  const Farm = createFarmMock();
  const calls = [];
  const currentUser = withVerifiedIdentity({
    id: 10,
    email: "ola@example.com",
    fullName: "Ola Bonde",
    role: "BOTH",
    status: "ACTIVE",
    createdAt: new Date("2026-04-09T10:00:00Z"),
    profile: {},
  });
  Farm.create = async (input) => {
    calls.push(input);
    return { id: 42 };
  };

  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm,
    auth: createAuthMock({ currentUser }),
  }));

  try {
    const { path, init } = postForm("/auksjoner", {
      title: "Ny gård",
      description: "Beskrivelse",
      ownerName: "Ola Bonde",
      municipality: "Råde",
      fylke: "Østfold",
      sizeDekar: "150.5",
      auctionStart: "2026-04-01",
      auctionEnd: "2026-04-10",
      startingBid: "725",
      cropTypes: "korn",
      lat: "",
      lng: "",
      fieldPolygon: "",
      soilType: "",
      soilQuality: "",
      rentalPeriodYears: "",
    });

    const { response } = await client.request(path, init);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/auksjoner/42");
    assert.deepEqual(calls, [{
      ownerUserId: 10,
      title: "Ny gård",
      description: "Beskrivelse",
      ownerName: "Ola Bonde",
      ownerDescription: null,
      municipality: "Råde",
      fylke: "Østfold",
      address: null,
      lat: 60.472,
      lng: 8.469,
      fieldPolygon: "[]",
      sizeDekar: 150.5,
      soilType: "Leirjord",
      soilQuality: "God",
      auctionStart: new Date("2026-04-01"),
      auctionEnd: new Date("2026-04-10"),
      startingBid: 725,
      rentalPeriodYears: 5,
      cropTypes: ["korn"],
    }]);
  } finally {
    await client.close();
  }
});

test("POST /auksjoner redirects unverified users before creating a listing", async () => {
  const Farm = createFarmMock();
  let createCalls = 0;
  const currentUser = {
    id: 10,
    email: "ola@example.com",
    fullName: "Ola Bonde",
    role: "BOTH",
    status: "ACTIVE",
    createdAt: new Date("2026-04-09T10:00:00Z"),
    profile: {},
    verifications: [],
  };
  Farm.create = async () => {
    createCalls += 1;
    return { id: 42 };
  };

  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm,
    auth: createAuthMock({ currentUser }),
  }));

  try {
    const { path, init } = postForm("/auksjoner", {
      title: "Ny gård",
      description: "Beskrivelse",
      ownerName: "Ola Bonde",
      municipality: "Råde",
      fylke: "Østfold",
      sizeDekar: "150.5",
      auctionStart: "2026-04-01",
      auctionEnd: "2026-04-10",
      startingBid: "725",
    });

    const { response } = await client.request(path, init);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/bankid/verifiser?next=%2Flag-annonse");
    assert.equal(createCalls, 0);
  } finally {
    await client.close();
  }
});

test("POST /auksjoner renders the error page when create fails", async () => {
  const Farm = createFarmMock();
  const currentUser = withVerifiedIdentity({
    id: 10,
    email: "ola@example.com",
    fullName: "Ola Bonde",
    role: "BOTH",
    status: "ACTIVE",
    createdAt: new Date("2026-04-09T10:00:00Z"),
    profile: {},
  });
  Farm.create = async () => {
    throw new Error("create failed");
  };

  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm,
    auth: createAuthMock({ currentUser }),
  }));

  try {
    const { path, init } = postForm("/auksjoner", {
      title: "Ny gård",
      description: "Beskrivelse",
      ownerName: "Ola Bonde",
      municipality: "Råde",
      fylke: "Østfold",
      sizeDekar: "150.5",
      auctionStart: "2026-04-01",
      auctionEnd: "2026-04-10",
      startingBid: "725",
    });

    const { response, body } = await client.request(path, init);
    assert.equal(response.status, 500);
    assert.equal(body.view, "error");
    assert.equal(body.locals.message, "Kunne ikke opprette annonsen.");
    assert.equal(body.locals.hint, "create failed");
  } finally {
    await client.close();
  }
});

test("POST /auksjoner/:id/bid returns 404 when the auction does not exist", async () => {
  const currentUser = withVerifiedIdentity({
    id: 12,
    email: "kari@example.com",
    fullName: "Kari",
    role: "BOTH",
    status: "ACTIVE",
    createdAt: new Date("2026-04-09T10:00:00Z"),
    profile: {},
  });
  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm: createFarmMock(),
    auth: createAuthMock({ currentUser }),
  }));

  try {
    const { path, init } = postForm("/auksjoner/4/bid", {
      bidAmount: "800",
      bidderName: "Kari",
    });

    const { response, body } = await client.request(path, init);
    assert.equal(response.status, 404);
    assert.equal(body, "Ikke funnet");
  } finally {
    await client.close();
  }
});

test("POST /auksjoner/:id/bid redirects unverified users before bid lookup", async () => {
  const Farm = createFarmMock();
  let findCalls = 0;
  let updateCalls = 0;
  const currentUser = {
    id: 12,
    email: "kari@example.com",
    fullName: "Kari",
    role: "BOTH",
    status: "ACTIVE",
    createdAt: new Date("2026-04-09T10:00:00Z"),
    profile: {},
    verifications: [],
  };
  Farm.findById = async () => {
    findCalls += 1;
    return { id: 5, currentBid: 0 };
  };
  Farm.updateBid = async () => {
    updateCalls += 1;
  };

  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm,
    auth: createAuthMock({ currentUser }),
  }));

  try {
    const { path, init } = postForm("/auksjoner/5/bid", {
      bidAmount: "810",
    });

    const { response } = await client.request(path, init);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/bankid/verifiser?next=%2Fauksjoner%2F5");
    assert.equal(findCalls, 0);
    assert.equal(updateCalls, 0);
  } finally {
    await client.close();
  }
});

test("POST /auksjoner/:id/bid places a bid when there is no current bid yet", async () => {
  const Farm = createFarmMock();
  const calls = [];
  const currentUser = withVerifiedIdentity({
    id: 12,
    email: "kari@example.com",
    fullName: "Kari",
    role: "BOTH",
    status: "ACTIVE",
    createdAt: new Date("2026-04-09T10:00:00Z"),
    profile: {},
  });
  Farm.findById = async () => ({ id: 5, currentBid: 0 });
  Farm.updateBid = async (...args) => {
    calls.push(args);
  };

  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm,
    auth: createAuthMock({ currentUser }),
  }));

  try {
    const { path, init } = postForm("/auksjoner/5/bid", {
      bidAmount: "810",
    });

    const { response } = await client.request(path, init);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/auksjoner/5");
    assert.deepEqual(calls, [[5, 810, "Kari", 12]]);
  } finally {
    await client.close();
  }
});

test("POST /auksjoner/:id/bid ignores bids that are not above the current bid", async () => {
  const Farm = createFarmMock();
  let updateCalls = 0;
  const currentUser = withVerifiedIdentity({
    id: 12,
    email: "kari@example.com",
    fullName: "Kari",
    role: "BOTH",
    status: "ACTIVE",
    createdAt: new Date("2026-04-09T10:00:00Z"),
    profile: {},
  });
  Farm.findById = async () => ({ id: 6, currentBid: 900 });
  Farm.updateBid = async () => {
    updateCalls += 1;
  };

  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm,
    auth: createAuthMock({ currentUser }),
  }));

  try {
    const { path, init } = postForm("/auksjoner/6/bid", {
      bidAmount: "900",
      bidderName: "Lavbyder",
    });

    const { response } = await client.request(path, init);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/auksjoner/6");
    assert.equal(updateCalls, 0);
  } finally {
    await client.close();
  }
});

test("POST /auksjoner/:id/bid renders the shared error view on bid failures", async () => {
  const Farm = createFarmMock();
  const currentUser = withVerifiedIdentity({
    id: 12,
    email: "kari@example.com",
    fullName: "Kari",
    role: "BOTH",
    status: "ACTIVE",
    createdAt: new Date("2026-04-09T10:00:00Z"),
    profile: {},
  });
  Farm.findById = async () => ({ id: 8, currentBid: 100 });
  Farm.updateBid = async () => {
    throw new Error("bid failed");
  };

  const client = await startApp(buildApp({
    prisma: createPrismaMock(),
    Farm,
    auth: createAuthMock({ currentUser }),
  }));

  try {
    const { path, init } = postForm("/auksjoner/8/bid", {
      bidAmount: "101",
      bidderName: "Kari",
    });

    const { response, body } = await client.request(path, init);
    assert.equal(response.status, 500);
    assert.equal(body.view, "error");
    assert.equal(body.locals.message, "Kunne ikke registrere budet.");
    assert.equal(body.locals.hint, "bid failed");
  } finally {
    await client.close();
  }
});
