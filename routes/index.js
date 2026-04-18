// ============================================================
// Index Routes - Home page and static pages
// ============================================================

const express = require("express");
const defaultPrisma = require("../prisma/client");
const defaultAuth = require("../lib/auth");

function readMessage(value) {
  if (!value || typeof value !== "string") return null;
  return value.trim() || null;
}

function appendQuery(target, params = {}) {
  const url = new URL(target, "http://localhost");

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return `${url.pathname}${url.search}`;
}

function getRequestOrigin(req) {
  const configuredOrigin = String(process.env.APP_URL || process.env.SITE_URL || "").trim();
  if (configuredOrigin) {
    return configuredOrigin.replace(/\/+$/, "");
  }

  const forwardedProto = String(req.headers["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim();
  const forwardedHost = String(req.headers["x-forwarded-host"] || "")
    .split(",")[0]
    .trim();
  const host = forwardedHost || req.get("host");

  if (!host) return null;

  return `${forwardedProto || req.protocol || "http"}://${host}`;
}

function buildEmailConfirmationUrl(req, nextPath) {
  const origin = getRequestOrigin(req);
  if (!origin) return undefined;

  const url = new URL("/auth/confirm", origin);
  url.searchParams.set("next", nextPath);
  return url.toString();
}

function createIndexRouter({ prisma = defaultPrisma, auth = defaultAuth } = {}) {
  const router = express.Router();

  // Public landing page (pre-login)
  router.get("/", (req, res) => {
    res.render("landing", { title: "Jordleie.no – Fremtidens jordleie" });
  });

  // About page
  router.get("/om-jordleie", (req, res) => {
    res.render("about", { title: "Om Jordleie.no" });
  });

  // How to buy and sell
  router.get("/hvordan-kjope-selge", (req, res) => {
    res.render("how-it-works", { title: "Hvordan kjøpe og selge" });
  });

  // Articles
  router.get("/artikler", (req, res) => {
    res.render("articles", { title: "Artikler" });
  });

  // Contact
  router.get("/kontakt", (req, res) => {
    const sendt = req.query.sendt === "true";
    res.render("contact", { title: "Kontakt oss", sendt });
  });

  // POST /kontakt – handle contact form submission
  router.post("/kontakt", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).render("error", {
          title: "Feil – Jordleie.no",
          message: "Navn, e-post og melding er påkrevd.",
          hint: "Fyll ut alle obligatoriske felter og prøv igjen.",
        });
      }

      await prisma.contactSubmission.create({
        data: {
          name: String(name).trim(),
          email: String(email).trim(),
          subject: subject ? String(subject).trim() : null,
          message: String(message).trim(),
        },
      });

      res.redirect("/kontakt?sendt=true");
    } catch (err) {
      console.error("POST /kontakt error:", err);
      res.status(500).render("error", {
        title: "Feil – Jordleie.no",
        message: "Kunne ikke sende meldingen.",
        hint: err.message,
      });
    }
  });

  // Login page
  router.get("/logg-inn", auth.redirectIfAuthenticated, (req, res) => {
    res.render("login", {
      title: "Logg inn – Jordleie.no",
      mode: "login",
      next: auth.safeRedirect(req.query.next, "/min-bruker"),
      error: readMessage(req.query.error),
      success: readMessage(req.query.success),
      authConfigured: auth.isConfigured(),
    });
  });

  // Registration page
  router.get("/registrer-deg", auth.redirectIfAuthenticated, (req, res) => {
    res.render("login", {
      title: "Registrer deg – Jordleie.no",
      mode: "signup",
      next: auth.safeRedirect(req.query.next, "/min-bruker"),
      error: readMessage(req.query.error),
      success: readMessage(req.query.success),
      authConfigured: auth.isConfigured(),
    });
  });

  router.post("/auth/logg-inn", async (req, res) => {
    const nextPath = auth.safeRedirect(req.body.next || req.query.next, "/min-bruker");
    const email = String(req.body.email || "").trim();
    const password = String(req.body.password || "");

    if (!email || !password) {
      const params = new URLSearchParams({
        error: "E-post og passord er påkrevd.",
        next: nextPath,
      });
      return res.redirect(`/logg-inn?${params.toString()}`);
    }

    try {
      await auth.signInWithPassword({ email, password, res });
      return res.redirect(nextPath);
    } catch (error) {
      const params = new URLSearchParams({
        error: error.message,
        next: nextPath,
      });
      return res.redirect(`/logg-inn?${params.toString()}`);
    }
  });

  router.post("/auth/registrer-deg", async (req, res) => {
    const nextPath = auth.safeRedirect(req.body.next || req.query.next, "/min-bruker");
    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "").trim();
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirmPassword || "");
    const birthDateRaw = String(req.body.birthDate || "").trim();
    const birthDate = birthDateRaw ? new Date(birthDateRaw) : null;

    if (!fullName || !email || !password) {
      const params = new URLSearchParams({
        error: "Navn, e-post og passord er påkrevd.",
        next: nextPath,
      });
      return res.redirect(`/registrer-deg?${params.toString()}`);
    }

    if (birthDate && Number.isNaN(birthDate.getTime())) {
      const params = new URLSearchParams({
        error: "Fødselsdatoen er ugyldig.",
        next: nextPath,
      });
      return res.redirect(`/registrer-deg?${params.toString()}`);
    }

    if (password.length < 8) {
      const params = new URLSearchParams({
        error: "Passordet må være minst 8 tegn langt.",
        next: nextPath,
      });
      return res.redirect(`/registrer-deg?${params.toString()}`);
    }

    if (password !== confirmPassword) {
      const params = new URLSearchParams({
        error: "Passordene er ikke like.",
        next: nextPath,
      });
      return res.redirect(`/registrer-deg?${params.toString()}`);
    }

    try {
      const result = await auth.signUpWithPassword({
        email,
        password,
        fullName,
        birthDate,
        emailRedirectTo: buildEmailConfirmationUrl(req, nextPath),
        res,
      });

      if (result.requiresEmailConfirmation) {
        const params = new URLSearchParams({
          success: "Kontoen er opprettet. Bekreft e-posten din og logg inn.",
          next: nextPath,
        });
        return res.redirect(`/logg-inn?${params.toString()}`);
      }

      return res.redirect(nextPath);
    } catch (error) {
      const params = new URLSearchParams({
        error: error.message,
        next: nextPath,
      });
      return res.redirect(`/registrer-deg?${params.toString()}`);
    }
  });

  async function handleAuthConfirmation(req, res) {
    const nextPath = auth.safeRedirect(req.query.next, "/min-bruker");
    const tokenHash = String(req.query.token_hash || "").trim();
    const type = String(req.query.type || "").trim();

    if (!tokenHash || !type) {
      return res.redirect(appendQuery("/logg-inn", {
        error: "Bekreftelseslenken er ugyldig eller mangler data.",
        next: nextPath,
      }));
    }

    try {
      const result = await auth.verifyOtp({ tokenHash, type, res });

      if (result.requiresSignIn) {
        return res.redirect(appendQuery("/logg-inn", {
          success: "E-posten er bekreftet. Logg inn for å fortsette.",
          next: nextPath,
        }));
      }

      return res.redirect(appendQuery(nextPath, {
        success: "E-posten er bekreftet. Du er nå logget inn.",
      }));
    } catch (error) {
      return res.redirect(appendQuery("/logg-inn", {
        error: error.message,
        next: nextPath,
      }));
    }
  }

  router.get("/auth/confirm", handleAuthConfirmation);
  router.get("/auth/bekreft", handleAuthConfirmation);

  router.post("/logg-ut", async (req, res) => {
    await auth.signOut(req, res);
    res.redirect("/logg-inn?success=Du%20er%20logget%20ut.");
  });

  // Min bruker (My profile / create listing)
  router.get("/min-bruker", auth.requireAuth, async (req, res) => {
    // Last inn verifications separat så profilsiden kan vise BankID-status
    const userWithVerifications = await prisma.user.findUnique({
      where: { id: req.currentUser.id },
      include: { profile: true, verifications: true },
    });

    res.render("my-profile", {
      title: "Min bruker",
      user: userWithVerifications || req.currentUser,
      success: readMessage(req.query.success),
      error: readMessage(req.query.error),
    });
  });

  router.post("/min-bruker", auth.requireAuth, async (req, res) => {
    const fullName = String(req.body.fullName || "").trim();
    const county = String(req.body.county || "").trim() || null;
    const bio = String(req.body.bio || "").trim() || null;

    if (!fullName) {
      const params = new URLSearchParams({
        error: "Navn er påkrevd.",
      });
      return res.redirect(`/min-bruker?${params.toString()}`);
    }

    try {
      await prisma.user.update({
        where: { id: req.currentUser.id },
        data: {
          fullName,
          profile: {
            upsert: {
              update: {
                county,
                bio,
              },
              create: {
                county,
                bio,
              },
            },
          },
        },
      });

      return res.redirect("/min-bruker?success=Profilen%20er%20oppdatert.");
    } catch (error) {
      console.error("POST /min-bruker error:", error);
      const params = new URLSearchParams({
        error: "Kunne ikke oppdatere profilen.",
      });
      return res.redirect(`/min-bruker?${params.toString()}`);
    }
  });

  // Lag annonse (Create listing)
  router.get("/lag-annonse", auth.requireAuth, (req, res) => {
    res.render("create-listing", {
      title: "Lag annonse",
      user: req.currentUser,
    });
  });

  return router;
}

const router = createIndexRouter();

module.exports = router;
module.exports.createIndexRouter = createIndexRouter;
