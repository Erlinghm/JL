const cookie = require("cookie");
const { createClient } = require("@supabase/supabase-js");
const defaultPrisma = require("../prisma/client");

const ACCESS_TOKEN_COOKIE = "jl-access-token";
const REFRESH_TOKEN_COOKIE = "jl-refresh-token";
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeFullName(fullName, email) {
  const value = String(fullName || "").trim();
  if (value) return value;

  const localPart = normalizeEmail(email).split("@")[0] || "Bruker";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ") || "Bruker";
}

function appendSetCookie(res, serializedCookie) {
  const currentHeader = res.getHeader("Set-Cookie");
  const nextHeader = Array.isArray(currentHeader)
    ? [...currentHeader, serializedCookie]
    : currentHeader
      ? [String(currentHeader), serializedCookie]
      : [serializedCookie];

  res.setHeader("Set-Cookie", nextHeader);
}

function buildCookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function safeRedirect(target, fallback = "/min-bruker") {
  if (!target || typeof target !== "string") return fallback;
  if (!target.startsWith("/") || target.startsWith("//")) return fallback;
  return target;
}

function getSupabasePublishableKey() {
  return process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getConfigurationErrorMessage() {
  return "Supabase Auth er ikke konfigurert. Sett SUPABASE_URL og SUPABASE_PUBLISHABLE_KEY.";
}

function readAdminFlag(authUser) {
  return authUser?.app_metadata?.is_admin === true;
}

function createDefaultSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublishableKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(getConfigurationErrorMessage());
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function createAuth({ prisma = defaultPrisma, createSupabaseClient = createDefaultSupabaseClient } = {}) {
  function isConfigured() {
    return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
  }

  function getCookies(req) {
    return cookie.parse(req.headers.cookie || "");
  }

  function setSessionCookies(res, session) {
    if (!session?.access_token || !session?.refresh_token) return;

    const accessCookie = cookie.serialize(
      ACCESS_TOKEN_COOKIE,
      session.access_token,
      buildCookieOptions(SESSION_COOKIE_MAX_AGE)
    );
    const refreshCookie = cookie.serialize(
      REFRESH_TOKEN_COOKIE,
      session.refresh_token,
      buildCookieOptions(SESSION_COOKIE_MAX_AGE)
    );

    appendSetCookie(res, accessCookie);
    appendSetCookie(res, refreshCookie);
  }

  function clearSessionCookies(res) {
    const expires = new Date(0);
    const expiredOptions = {
      ...buildCookieOptions(0),
      expires,
    };

    appendSetCookie(res, cookie.serialize(ACCESS_TOKEN_COOKIE, "", expiredOptions));
    appendSetCookie(res, cookie.serialize(REFRESH_TOKEN_COOKIE, "", expiredOptions));
  }

  async function syncLocalUser(authUser, defaults = {}) {
    if (!authUser?.id || !authUser.email) {
      throw new Error("Mangler brukerdata fra Supabase.");
    }

    const email = normalizeEmail(authUser.email);
    const fullName = normalizeFullName(
      defaults.fullName || authUser.user_metadata?.full_name || authUser.user_metadata?.fullName,
      email
    );
    const phone = authUser.phone || defaults.phone || null;
    const isAdmin = readAdminFlag(authUser);

    // Aksepter Date eller ISO-streng for fødselsdato
    let birthDate = null;
    if (defaults.birthDate instanceof Date && !Number.isNaN(defaults.birthDate.getTime())) {
      birthDate = defaults.birthDate;
    } else if (typeof defaults.birthDate === "string" && defaults.birthDate.trim()) {
      const parsed = new Date(defaults.birthDate);
      if (!Number.isNaN(parsed.getTime())) birthDate = parsed;
    }

    const profileData = birthDate ? { birthDate } : {};
    const profileUpsert = {
      upsert: {
        update: profileData,
        create: profileData,
      },
    };

    const existingByAuthId = await prisma.user.findUnique({
      where: { authUserId: authUser.id },
      include: { profile: true },
    });

    if (existingByAuthId) {
      return prisma.user.update({
        where: { id: existingByAuthId.id },
        data: {
          email,
          fullName,
          phone,
          isAdmin,
          ...(birthDate ? { profile: profileUpsert } : {}),
        },
        include: { profile: true },
      });
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (existingByEmail) {
      return prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          authUserId: authUser.id,
          fullName,
          phone,
          isAdmin,
          ...(birthDate ? { profile: profileUpsert } : {}),
        },
        include: { profile: true },
      });
    }

    return prisma.user.create({
      data: {
        authUserId: authUser.id,
        email,
        fullName,
        phone,
        isAdmin,
        status: "ACTIVE",
        profile: {
          create: profileData,
        },
      },
      include: { profile: true },
    });
  }

  async function loadCurrentUser(req, res) {
    if (!isConfigured()) return null;

    const cookies = getCookies(req);
    const accessToken = cookies[ACCESS_TOKEN_COOKIE];
    const refreshToken = cookies[REFRESH_TOKEN_COOKIE];

    if (!accessToken && !refreshToken) return null;
    if (!accessToken || !refreshToken) {
      clearSessionCookies(res);
      return null;
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      clearSessionCookies(res);
      return null;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(data.session.access_token);
    if (userError || !userData.user) {
      clearSessionCookies(res);
      return null;
    }

    setSessionCookies(res, data.session);
    return {
      authUser: userData.user,
      currentUser: await syncLocalUser(userData.user),
      session: data.session,
    };
  }

  async function attachCurrentUser(req, res, next) {
    req.currentUser = null;
    req.authUser = null;
    res.locals.currentUser = null;
    res.locals.authUser = null;
    res.locals.isAuthenticated = false;
    res.locals.authConfigured = isConfigured();

    if (!isConfigured()) {
      return next();
    }

    try {
      const authContext = await loadCurrentUser(req, res);
      req.currentUser = authContext?.currentUser || null;
      req.authUser = authContext?.authUser || null;
      res.locals.currentUser = req.currentUser;
      res.locals.authUser = req.authUser;
      res.locals.isAuthenticated = Boolean(req.currentUser);
      return next();
    } catch (error) {
      return next(error);
    }
  }

  function requireAuth(req, res, next) {
    if (req.currentUser) return next();

    const params = new URLSearchParams({
      error: "Du må logge inn for å fortsette.",
      next: safeRedirect(req.originalUrl, "/min-bruker"),
    });

    return res.redirect(`/logg-inn?${params.toString()}`);
  }

  function redirectIfAuthenticated(req, res, next) {
    if (!req.currentUser) return next();
    return res.redirect(safeRedirect(req.query.next, "/min-bruker"));
  }

  async function signInWithPassword({ email, password, res }) {
    if (!isConfigured()) {
      throw new Error(getConfigurationErrorMessage());
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizeEmail(email),
      password: String(password || ""),
    });

    if (error) throw new Error(error.message);
    if (!data.session || !data.user) {
      throw new Error("Innlogging mislyktes. Prøv igjen.");
    }

    setSessionCookies(res, data.session);

    return {
      authUser: data.user,
      user: await syncLocalUser(data.user),
    };
  }

  async function signUpWithPassword({ email, password, fullName, birthDate, emailRedirectTo, res }) {
    if (!isConfigured()) {
      throw new Error(getConfigurationErrorMessage());
    }

    const supabase = createSupabaseClient();
    const options = {
      data: {
        full_name: normalizeFullName(fullName, email),
      },
    };

    if (emailRedirectTo) {
      options.emailRedirectTo = emailRedirectTo;
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizeEmail(email),
      password: String(password || ""),
      options,
    });

    if (error) throw new Error(error.message);
    if (!data.user) {
      throw new Error("Registrering mislyktes. Prøv igjen.");
    }

    // Supabase returns an empty identities array for repeated signup attempts on
    // existing emails (email enumeration protection). The returned user.id is a
    // fake UUID that does not exist in auth.users, so we must not proceed to
    // syncLocalUser — doing so causes a FK constraint violation.
    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error("En konto med denne e-postadressen finnes allerede. Logg inn i stedet.");
    }

    const user = await syncLocalUser(data.user, { fullName, birthDate });

    if (data.session) {
      setSessionCookies(res, data.session);
    }

    return {
      authUser: data.user,
      user,
      requiresEmailConfirmation: !data.session,
    };
  }

  async function verifyOtp({ tokenHash, type, res }) {
    if (!isConfigured()) {
      throw new Error(getConfigurationErrorMessage());
    }

    if (!tokenHash || !type) {
      throw new Error("Bekreftelseslenken er ugyldig eller mangler data.");
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: String(tokenHash),
      type: String(type),
    });

    if (error) throw new Error(error.message);
    if (!data.user) {
      throw new Error("Kunne ikke bekrefte innloggingen. Prøv igjen.");
    }

    if (data.session) {
      setSessionCookies(res, data.session);
    }

    return {
      authUser: data.user,
      user: await syncLocalUser(data.user),
      requiresSignIn: !data.session,
    };
  }

  async function signOut(req, res) {
    if (isConfigured()) {
      try {
        const cookies = getCookies(req);
        const accessToken = cookies[ACCESS_TOKEN_COOKIE];
        const refreshToken = cookies[REFRESH_TOKEN_COOKIE];

        if (accessToken && refreshToken) {
          const supabase = createSupabaseClient();
          const { data } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (data.session) {
            await supabase.auth.signOut({ scope: "local" });
          }
        }
      } catch (error) {
        console.error("Supabase signOut error:", error);
      }
    }

    clearSessionCookies(res);
  }

  return {
    isConfigured,
    attachCurrentUser,
    requireAuth,
    redirectIfAuthenticated,
    signInWithPassword,
    signUpWithPassword,
    verifyOtp,
    signOut,
    safeRedirect,
  };
}

const auth = createAuth();

module.exports = auth;
module.exports.createAuth = createAuth;
module.exports.safeRedirect = safeRedirect;
