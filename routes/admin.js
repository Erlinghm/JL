// ============================================================
// Admin Routes - CRUD for farm listings
// ============================================================

const express = require("express");
const defaultFarm = require("../models/Farm");
const defaultAuth = require("../lib/auth");

function isAdminUser(auth, user, authUser) {
  if (typeof auth.isAdminUser === "function") {
    return auth.isAdminUser(user, authUser);
  }

  return user?.isAdmin === true
    || user?.role === "ADMIN"
    || authUser?.app_metadata?.is_admin === true;
}

function formToFarmInput(body, { defaultMissingMapFields = false } = {}) {
  return {
    title: body.title,
    description: body.description,
    ownerName: body.ownerName,
    ownerDescription: body.ownerDescription || null,
    municipality: body.municipality,
    fylke: body.fylke,
    address: body.address || null,
    lat: body.lat,
    lng: body.lng,
    fieldPolygon: defaultMissingMapFields ? body.fieldPolygon || "[]" : body.fieldPolygon,
    sizeDekar: parseFloat(body.sizeDekar),
    soilType: body.soilType || "Leirjord",
    soilQuality: body.soilQuality || "God",
    auctionStart: new Date(body.auctionStart),
    auctionEnd: new Date(body.auctionEnd),
    startingBid: parseFloat(body.startingBid),
    currentBid: body.currentBid === undefined ? undefined : parseFloat(body.currentBid),
    rentalPeriodYears: parseInt(body.rentalPeriodYears, 10) || 5,
    status: body.status,
    cropTypes: Array.isArray(body.cropTypes)
      ? body.cropTypes
      : body.cropTypes
        ? [body.cropTypes]
        : undefined,
  };
}

function createAdminRouter({ Farm = defaultFarm, auth = defaultAuth } = {}) {
  const router = express.Router();

  router.get("/", (req, res) => {
    res.redirect("/admin/dashboard");
  });

  router.get("/logg-inn", (req, res) => {
    if (isAdminUser(auth, req.currentUser, req.authUser)) {
      return res.redirect("/admin/dashboard");
    }

    return res.render("admin/login", {
      title: "Admin - Logg inn",
      feil: req.query.error || null,
    });
  });

  router.post("/logg-inn", async (req, res) => {
    const email = String(req.body.epost || "").trim();
    const password = String(req.body.passord || "");

    if (!email || !password) {
      return res.status(400).render("admin/login", {
        title: "Admin - Logg inn",
        feil: "E-post og passord er påkrevd.",
      });
    }

    try {
      const result = await auth.signInWithPassword({ email, password, res });
      if (!isAdminUser(auth, result.user, result.authUser)) {
        await auth.signOut(req, res);
        return res.status(403).render("admin/login", {
          title: "Admin - Logg inn",
          feil: "Brukeren har ikke admin-tilgang.",
        });
      }

      return res.redirect("/admin/dashboard");
    } catch (error) {
      return res.status(401).render("admin/login", {
        title: "Admin - Logg inn",
        feil: "Feil e-post eller passord.",
      });
    }
  });

  router.post("/logg-ut", async (req, res) => {
    await auth.signOut(req, res);
    res.redirect("/admin/logg-inn");
  });

  router.get("/dashboard", auth.requireAdmin, async (req, res) => {
    try {
      const farms = await Farm.find({});
      farms.sort((a, b) => new Date(b.auctionStart) - new Date(a.auctionStart));
      res.render("admin/dashboard", {
        title: "Admin-panel - Jordleie.no",
        farms,
      });
    } catch (err) {
      console.error("GET /admin/dashboard error:", err);
      res.status(500).render("error", {
        title: "Feil - Admin",
        message: "Kunne ikke hente annonser.",
        hint: err.message,
      });
    }
  });

  router.get("/annonser/ny", auth.requireAdmin, (req, res) => {
    res.render("admin/new", { title: "Ny annonse - Admin" });
  });

  router.post("/annonser", auth.requireAdmin, async (req, res) => {
    try {
      await Farm.create(formToFarmInput(req.body, { defaultMissingMapFields: true }));
      res.redirect("/admin/dashboard");
    } catch (err) {
      console.error("POST /admin/annonser error:", err);
      res.status(500).render("error", {
        title: "Feil - Admin",
        message: "Kunne ikke opprette annonsen.",
        hint: err.message,
      });
    }
  });

  router.get("/annonser/:id/rediger", auth.requireAdmin, async (req, res) => {
    try {
      const farm = await Farm.findById(req.params.id);
      if (!farm) return res.status(404).render("404", { title: "Ikke funnet" });
      res.render("admin/edit", {
        title: "Rediger annonse - Admin",
        farm,
      });
    } catch (err) {
      console.error("GET /admin/annonser/:id/rediger error:", err);
      res.status(500).render("error", {
        title: "Feil - Admin",
        message: "Kunne ikke hente annonsen.",
        hint: err.message,
      });
    }
  });

  router.put("/annonser/:id", auth.requireAdmin, async (req, res) => {
    try {
      await Farm.update(req.params.id, formToFarmInput(req.body));
      res.redirect("/admin/dashboard");
    } catch (err) {
      console.error("PUT /admin/annonser/:id error:", err);
      res.status(500).render("error", {
        title: "Feil - Admin",
        message: "Kunne ikke oppdatere annonsen.",
        hint: err.message,
      });
    }
  });

  router.delete("/annonser/:id", auth.requireAdmin, async (req, res) => {
    try {
      await Farm.deleteById(req.params.id);
      res.redirect("/admin/dashboard");
    } catch (err) {
      console.error("DELETE /admin/annonser/:id error:", err);
      res.status(500).render("error", {
        title: "Feil - Admin",
        message: "Kunne ikke slette annonsen.",
        hint: err.message,
      });
    }
  });

  return router;
}

const router = createAdminRouter();

module.exports = router;
module.exports.createAdminRouter = createAdminRouter;
