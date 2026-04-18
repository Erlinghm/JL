const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");

const { createLeaseRouter } = require("../routes/leases");

function makeAuthMock(currentUser) {
  return {
    attachCurrentUser(req, _res, next) {
      req.currentUser = currentUser;
      next();
    },
    requireAuth(req, res, next) {
      if (currentUser) return next();
      return res.redirect("/logg-inn");
    },
  };
}

async function startLeaseApp({ Lease, currentUser }) {
  const auth = makeAuthMock(currentUser);
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(auth.attachCurrentUser);
  app.use("/", createLeaseRouter({ Lease, auth }));

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const origin = `http://127.0.0.1:${server.address().port}`;

  async function post(path) {
    return fetch(new URL(path, origin), {
      method: "POST",
      redirect: "manual",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "",
    });
  }

  async function close() {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  return { post, close };
}

test("POST /auksjoner/:id/avslutt forwards the current user's id to Lease.createFromListing", async () => {
  const calls = [];
  const Lease = {
    createFromListing: async (id, options) => {
      calls.push({ id, options });
      return 55;
    },
  };

  const app = await startLeaseApp({
    Lease,
    currentUser: { id: 42, fullName: "Ola Bonde" },
  });

  try {
    const res = await app.post("/auksjoner/7/avslutt");
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "/avtaler/55");
    assert.deepEqual(calls, [{ id: "7", options: { userId: 42 } }]);
  } finally {
    await app.close();
  }
});

test("POST /auksjoner/:id/avslutt redirects to the auction with the model's error message", async () => {
  const Lease = {
    createFromListing: async () => {
      throw new Error("Berre eigaren av annonsen kan avslutte auksjonen.");
    },
  };

  const app = await startLeaseApp({
    Lease,
    currentUser: { id: 1, fullName: "Andre" },
  });

  try {
    const res = await app.post("/auksjoner/9/avslutt");
    assert.equal(res.status, 302);
    const location = res.headers.get("location");
    assert.ok(location.startsWith("/auksjoner/9?error="), `unexpected location ${location}`);
    assert.ok(location.includes(encodeURIComponent("Berre eigaren")));
  } finally {
    await app.close();
  }
});

test("POST /auksjoner/:id/avslutt requires authentication", async () => {
  const Lease = {
    createFromListing: async () => {
      throw new Error("should not run");
    },
  };

  const app = await startLeaseApp({ Lease, currentUser: null });
  try {
    const res = await app.post("/auksjoner/9/avslutt");
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "/logg-inn");
  } finally {
    await app.close();
  }
});
