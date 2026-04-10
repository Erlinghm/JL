const express = require("express");
const { CriiptoVerifyExpressRedirect } = require("@criipto/verify-express");
const defaultPrisma = require("../prisma/client");
const defaultAuth = require("../lib/auth");

const BANKID_PROVIDER = "IDURA_VERIFY";
const BANKID_VERIFY_PATH = "/bankid/verifiser";
const BANKID_ERROR_PATH = "/bankid/feil";
const DEFAULT_ACR_VALUES = "urn:grn:authn:no:bankid";

function appendQuery(path, params) {
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) urlParams.set(key, value);
  });

  const query = urlParams.toString();
  if (!query) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
}

function getBankIdConfig(env = process.env) {
  return {
    domain: env.IDURA_DOMAIN,
    clientID: env.IDURA_CLIENT_ID,
    clientSecret: env.IDURA_CLIENT_SECRET,
    acrValues: env.IDURA_ACR_VALUES || DEFAULT_ACR_VALUES,
    loginHint: env.IDURA_LOGIN_HINT || null,
  };
}

function isBankIdConfigured(config = getBankIdConfig()) {
  return Boolean(config.domain && config.clientID && config.clientSecret);
}

function createBankIdRedirect(config = getBankIdConfig()) {
  return new CriiptoVerifyExpressRedirect({
    domain: config.domain,
    clientID: config.clientID,
    clientSecret: config.clientSecret,
    redirectUri: BANKID_VERIFY_PATH,
    postLogoutRedirectUri: "/min-bruker",
    beforeAuthorize(req, options) {
      const authorizeOptions = {
        ...options,
        acr_values: config.acrValues,
      };

      if (config.loginHint) {
        authorizeOptions.login_hint = config.loginHint;
      }

      return authorizeOptions;
    },
  });
}

function getProviderSubject(claims) {
  const subject = claims?.sub || claims?.nameidentifier;
  return subject ? String(subject) : null;
}

function getAcr(claims) {
  const acr = claims?.acr || claims?.authenticationtype;
  return acr ? String(acr) : null;
}

function isProviderSubjectUniqueError(error) {
  const target = Array.isArray(error?.meta?.target) ? error.meta.target : [];
  return error?.code === "P2002"
    && target.includes("provider")
    && (target.includes("provider_subject") || target.includes("providerSubject"));
}

async function markUserVerifiedWithBankId({ prisma, userId, claims }) {
  const providerSubject = getProviderSubject(claims);
  if (!providerSubject) {
    throw new Error("BankID-verifiseringen mangler en gyldig brukeridentitet.");
  }

  const existing = await prisma.userVerification.findFirst({
    where: {
      provider: BANKID_PROVIDER,
      providerSubject,
      NOT: {
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    throw new Error("Denne BankID-en er allerede knyttet til en annen bruker.");
  }

  const verifiedAt = new Date();
  const data = {
    status: "VERIFIED",
    provider: BANKID_PROVIDER,
    providerSubject,
    acr: getAcr(claims),
    verifiedAt,
    reviewedAt: verifiedAt,
    notes: "Verifisert med BankID via Idura Verify.",
  };

  try {
    return await prisma.userVerification.upsert({
      where: {
        userId_type: {
          userId,
          type: "IDENTITY",
        },
      },
      update: data,
      create: {
        userId,
        type: "IDENTITY",
        ...data,
      },
    });
  } catch (error) {
    if (isProviderSubjectUniqueError(error)) {
      throw new Error("Denne BankID-en er allerede knyttet til en annen bruker.");
    }

    throw error;
  }
}

function clearBankIdSession(req) {
  if (!req.session) return;
  delete req.session.bankIdNext;
  delete req.session.verifyClaims;
  delete req.session.verifyRedirectUri;
}

function createBankIdRouter({
  prisma = defaultPrisma,
  auth = defaultAuth,
  bankIdRedirect = null,
  env = process.env,
} = {}) {
  const router = express.Router();
  const config = getBankIdConfig(env);
  const configured = isBankIdConfigured(config);
  const redirect = bankIdRedirect || (configured ? createBankIdRedirect(config) : null);

  function redirectWithError(res, message) {
    return res.redirect(appendQuery("/min-bruker", { error: message }));
  }

  function requireBankIdConfigured(req, res, next) {
    if (configured && redirect) return next();

    return redirectWithError(
      res,
      "BankID-verifisering er ikke konfigurert ennå."
    );
  }

  function prepareVerification(req, res, next) {
    const isCallback = Boolean(req.query.code || req.query.error);
    const nextPath = auth.safeRedirect(
      req.query.next || req.session?.bankIdNext,
      "/min-bruker"
    );

    if (req.session) {
      req.session.bankIdNext = nextPath;
    }

    if (!isCallback && auth.hasVerifiedIdentity(req.currentUser)) {
      clearBankIdSession(req);
      return res.redirect(nextPath);
    }

    return next();
  }

  router.get(
    BANKID_VERIFY_PATH,
    auth.requireAuth,
    prepareVerification,
    requireBankIdConfigured,
    (req, res, next) => redirect.middleware({
      force: true,
      failureRedirect: BANKID_ERROR_PATH,
    })(req, res, next),
    async (req, res) => {
      const nextPath = auth.safeRedirect(req.session?.bankIdNext, "/min-bruker");

      try {
        await markUserVerifiedWithBankId({
          prisma,
          userId: req.currentUser.id,
          claims: req.claims,
        });

        clearBankIdSession(req);
        return res.redirect(appendQuery(nextPath, {
          success: "BankID-verifisering er fullført.",
        }));
      } catch (error) {
        console.error("BankID verification error:", error);
        clearBankIdSession(req);
        return redirectWithError(res, error.message || "BankID-verifisering mislyktes.");
      }
    }
  );

  router.get(BANKID_ERROR_PATH, (req, res) => {
    const message = req.query.error_description
      || req.query.error
      || "BankID-verifisering ble avbrutt eller mislyktes.";

    clearBankIdSession(req);
    return redirectWithError(res, String(message));
  });

  return router;
}

module.exports = {
  BANKID_PROVIDER,
  BANKID_VERIFY_PATH,
  BANKID_ERROR_PATH,
  DEFAULT_ACR_VALUES,
  createBankIdRouter,
  createBankIdRedirect,
  getBankIdConfig,
  isBankIdConfigured,
  markUserVerifiedWithBankId,
};
