// ============================================================
// BankID Routes
//
// GET  /auth/bankid/start    – Starter OIDC-flyten mot Criipto
// GET  /auth/bankid/callback – Håndterer callback fra Criipto
//
// Brukeren MÅ være innlogget (via Supabase) for å verifisere
// identiteten sin med BankID. Etter vellykket verifisering
// oppdateres UserVerification (type=IDENTITY, status=VERIFIED).
// ============================================================

const express = require("express");
const defaultPrisma = require("../prisma/client");
const defaultAuth = require("../lib/auth");
const bankid = require("../lib/bankid");

// ---- Hjelpefunksjoner -------------------------------------

function getAppUrl(req) {
  const configured = String(process.env.APP_URL || process.env.SITE_URL || "").trim();
  if (configured) return configured.replace(/\/+$/, "");

  const proto =
    String(req.headers["x-forwarded-proto"] || "")
      .split(",")[0]
      .trim() ||
    req.protocol ||
    "http";
  const host =
    String(req.headers["x-forwarded-host"] || "")
      .split(",")[0]
      .trim() || req.get("host");

  return `${proto}://${host}`;
}

// ---- Router -----------------------------------------------

function createBankIdRouter({ prisma = defaultPrisma, auth = defaultAuth } = {}) {
  const router = express.Router();

  /**
   * GET /auth/bankid/start
   *
   * Krever innlogging. Genererer PKCE-parametere og state,
   * lagrer dem i en kortlivet cookie, og redirecter brukeren
   * til Criiptos autorisasjonsside for norsk BankID.
   */
  router.get("/auth/bankid/start", auth.requireAuth, (req, res) => {
    if (!bankid.isConfigured()) {
      return res.redirect(
        "/min-bruker?error=" +
          encodeURIComponent(
            "BankID er ikke konfigurert. Ta kontakt med administrator."
          )
      );
    }

    const codeVerifier = bankid.generateCodeVerifier();
    const codeChallenge = bankid.generateCodeChallenge(codeVerifier);
    const state = bankid.generateState();
    const appUrl = getAppUrl(req);

    bankid.setStateCookie(res, { state, codeVerifier });

    const authUrl = bankid.buildAuthorizationUrl({ appUrl, state, codeChallenge });
    return res.redirect(authUrl);
  });

  /**
   * GET /auth/bankid/callback
   *
   * Criipto redirecter hit etter BankID-autentisering.
   * Validerer state, bytter code mot tokens, leser identitet
   * fra id_token og oppdaterer UserVerification i databasen.
   */
  router.get("/auth/bankid/callback", auth.requireAuth, async (req, res) => {
    const { code, state, error, error_description } = req.query;

    // ---- Håndter feil fra Criipto ----
    if (error) {
      console.error("[BankID] Feil fra Criipto:", error, error_description);
      bankid.clearStateCookie(res);
      const msg =
        error === "access_denied"
          ? "BankID-verifisering ble avbrutt."
          : `BankID-feil: ${error_description || error}`;
      return res.redirect(`/min-bruker?error=${encodeURIComponent(msg)}`);
    }

    // ---- Les og valider state-cookie ----
    const stored = bankid.readStateCookie(req);
    bankid.clearStateCookie(res);

    if (!stored) {
      return res.redirect(
        "/min-bruker?error=" +
          encodeURIComponent("Sesjonsdata mangler. Prøv å verifisere på nytt.")
      );
    }

    if (!state || state !== stored.state) {
      return res.redirect(
        "/min-bruker?error=" +
          encodeURIComponent("Ugyldig state-parameter. Prøv å verifisere på nytt.")
      );
    }

    if (!code) {
      return res.redirect(
        "/min-bruker?error=" + encodeURIComponent("Mangler autorisasjonskode fra BankID.")
      );
    }

    // ---- Bytt code mot tokens ----
    let identity;
    try {
      const appUrl = getAppUrl(req);
      const tokens = await bankid.exchangeCode({
        code,
        codeVerifier: stored.codeVerifier,
        appUrl,
      });

      identity = bankid.parseIdToken(tokens.id_token);
    } catch (err) {
      console.error("[BankID] Token-utveksling feilet:", err);
      return res.redirect(
        "/min-bruker?error=" +
          encodeURIComponent(`Kunne ikke hente identitet fra BankID: ${err.message}`)
      );
    }

    // ---- Oppdater UserVerification i databasen ----
    try {
      await prisma.userVerification.upsert({
        where: {
          userId_type: {
            userId: req.currentUser.id,
            type: "IDENTITY",
          },
        },
        update: {
          status: "VERIFIED",
          reviewedAt: new Date(),
          notes: buildVerificationNote(identity),
        },
        create: {
          userId: req.currentUser.id,
          type: "IDENTITY",
          status: "VERIFIED",
          reviewedAt: new Date(),
          notes: buildVerificationNote(identity),
        },
      });

      // Oppdater navn hvis BankID returnerte et bekreftet navn
      if (identity.name && identity.name.trim()) {
        await prisma.user.update({
          where: { id: req.currentUser.id },
          data: {
            fullName: identity.name.trim(),
          },
        });
      }

      // Lagre fødselsdato frå BankID til UserProfile (overstyrer evt. manuelt innskriven dato)
      if (identity.birthdate && /^\d{4}-\d{2}-\d{2}$/.test(identity.birthdate)) {
        const birthDate = new Date(identity.birthdate);
        if (!Number.isNaN(birthDate.getTime())) {
          await prisma.userProfile.upsert({
            where: { userId: req.currentUser.id },
            update: { birthDate },
            create: { userId: req.currentUser.id, birthDate },
          });
        }
      }

      return res.redirect(
        "/min-bruker?success=" +
          encodeURIComponent("Identiteten din er bekreftet med BankID! ✓")
      );
    } catch (err) {
      console.error("[BankID] Databaseoppdatering feilet:", err);
      return res.redirect(
        "/min-bruker?error=" +
          encodeURIComponent("BankID-verifisering godkjent, men kunne ikke lagre. Prøv igjen.")
      );
    }
  });

  return router;
}

// ---- Hjelpefunksjon for notat ----

function buildVerificationNote(identity) {
  const parts = ["Verifisert via norsk BankID (Criipto)."];
  if (identity.name) parts.push(`Navn: ${identity.name}`);
  if (identity.birthdate) parts.push(`Fødselsdato: ${identity.birthdate}`);
  if (identity.sub) parts.push(`BankID-sub: ${identity.sub}`);
  return parts.join(" ");
}

module.exports = { createBankIdRouter };
