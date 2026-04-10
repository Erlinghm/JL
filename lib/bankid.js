// ============================================================
// BankID / Criipto OIDC Integration
//
// Brukes for identitetsverifisering av brukere via norsk BankID.
// Flyten er: bruker logger inn normalt (Supabase), deretter
// velger de å verifisere identiteten sin med BankID.
//
// Miljøvariabler som må settes:
//   CRIIPTO_DOMAIN      – f.eks. "ditt-domene.criipto.id"
//   CRIIPTO_CLIENT_ID   – client ID fra Criipto-dashbordet
//   CRIIPTO_CLIENT_SECRET – client secret fra Criipto-dashbordet
// ============================================================

const crypto = require("crypto");
const cookie = require("cookie");

const BANKID_STATE_COOKIE = "jl-bankid-pkce";
const STATE_COOKIE_MAX_AGE = 10 * 60; // 10 minutter

// ---- Criipto-konfigurasjon --------------------------------

function getCriiptoConfig() {
  return {
    domain: process.env.CRIIPTO_DOMAIN,
    clientId: process.env.CRIIPTO_CLIENT_ID,
    clientSecret: process.env.CRIIPTO_CLIENT_SECRET,
  };
}

function isConfigured() {
  const { domain, clientId, clientSecret } = getCriiptoConfig();
  return Boolean(domain && clientId && clientSecret);
}

// ---- PKCE-hjelpere ----------------------------------------

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(codeVerifier) {
  return crypto.createHash("sha256").update(codeVerifier).digest("base64url");
}

function generateState() {
  return crypto.randomBytes(16).toString("hex");
}

// ---- Callback URL -----------------------------------------

function getCallbackUrl(appUrl) {
  return `${appUrl}/auth/bankid/callback`;
}

// ---- Autoriseringslenke -----------------------------------

/**
 * Bygger redirect-URL til Criiptos autorisasjonsendepunkt.
 * acr_values=urn:grn:authn:no:bankid velger norsk BankID.
 */
function buildAuthorizationUrl({ appUrl, state, codeChallenge }) {
  const { domain, clientId } = getCriiptoConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getCallbackUrl(appUrl),
    scope: "openid",
    acr_values: "urn:grn:authn:no:bankid",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://${domain}/oauth2/authorize?${params.toString()}`;
}

// ---- Token-utveksling -------------------------------------

/**
 * Bytter authorization code mot id_token + access_token.
 */
async function exchangeCode({ code, codeVerifier, appUrl }) {
  const { domain, clientId, clientSecret } = getCriiptoConfig();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`https://${domain}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getCallbackUrl(appUrl),
      code_verifier: codeVerifier,
    }).toString(),
  });

  const json = await response.json();

  if (!response.ok) {
    const msg = json.error_description || json.error || `HTTP ${response.status}`;
    throw new Error(`Token-utveksling mislyktes: ${msg}`);
  }

  return json;
}

// ---- Parse id_token (JWT) ---------------------------------

/**
 * Dekoder payload-delen av JWT uten signaturvalidering.
 * Criipto signerer token – for produksjon bør man validere
 * signaturen via Criiptos JWKS-endepunkt.
 *
 * Relevante claims fra norsk BankID:
 *   sub             – unik bruker-ID (persistent)
 *   name            – fullt navn
 *   birthdate       – fødselsdato (YYYY-MM-DD)
 *   phone_number    – telefonnummer (hvis scope=phone)
 */
function parseIdToken(idToken) {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Mangler id_token.");
  }
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Ugyldig id_token-format.");
  }
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw new Error("Kunne ikke dekode id_token.");
  }
}

// ---- Cookie-håndtering ------------------------------------

function buildCookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/**
 * Lagrer state + codeVerifier i en kortlivet cookie.
 */
function setStateCookie(res, { state, codeVerifier }) {
  const value = JSON.stringify({ state, codeVerifier });
  const serialized = cookie.serialize(
    BANKID_STATE_COOKIE,
    value,
    buildCookieOptions(STATE_COOKIE_MAX_AGE)
  );
  const existing = res.getHeader("Set-Cookie");
  const next = Array.isArray(existing)
    ? [...existing, serialized]
    : existing
    ? [String(existing), serialized]
    : [serialized];
  res.setHeader("Set-Cookie", next);
}

/**
 * Leser state + codeVerifier fra cookie.
 * Returnerer null hvis cookie mangler eller er ugyldig.
 */
function readStateCookie(req) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const raw = cookies[BANKID_STATE_COOKIE];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.state || !parsed.codeVerifier) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Sletter state-cookien etter bruk.
 */
function clearStateCookie(res) {
  const expired = cookie.serialize(BANKID_STATE_COOKIE, "", {
    ...buildCookieOptions(0),
    expires: new Date(0),
  });
  const existing = res.getHeader("Set-Cookie");
  const next = Array.isArray(existing)
    ? [...existing, expired]
    : existing
    ? [String(existing), expired]
    : [expired];
  res.setHeader("Set-Cookie", next);
}

module.exports = {
  isConfigured,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
  exchangeCode,
  parseIdToken,
  setStateCookie,
  readStateCookie,
  clearStateCookie,
};
