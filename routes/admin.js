// ============================================================
// Admin Routes – CRUD for farm listings
// Auth: Supabase Auth (signInWithPassword + getUser)
// ============================================================

const express   = require("express");
const router    = express.Router();
const Farm      = require("../models/Farm");
const isAdmin   = require("../middleware/isAdmin");
const supabase  = require("../config/supabase");

// ---- GET /admin/logg-inn – Show login form ----
router.get("/logg-inn", (req, res) => {
  res.render("admin/login", { title: "Admin – Logg inn", feil: null });
});

// ---- POST /admin/logg-inn – Authenticate with Supabase ----
router.post("/logg-inn", async (req, res) => {
  const { epost, passord } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: epost,
    password: passord,
  });

  if (error || !data.session) {
    return res.render("admin/login", {
      title: "Admin – Logg inn",
      feil: "Feil e-post eller passord.",
    });
  }

  req.session.accessToken = data.session.access_token;
  res.redirect("/admin/dashboard");
});

// ---- POST /admin/logg-ut – Destroy session ----
router.post("/logg-ut", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/logg-inn");
  });
});

// ---- GET /admin/dashboard – List all farms ----
router.get("/dashboard", isAdmin, async (req, res) => {
  try {
    const farms = await Farm.find({}, { auctionStart: "desc" });
    // Sort by auctionStart descending (Farm.find always returns asc, re-sort here)
    farms.sort((a, b) => new Date(b.auctionStart) - new Date(a.auctionStart));
    res.render("admin/dashboard", { title: "Admin-panel – Jordleie.no", farms });
  } catch (err) {
    console.error("GET /admin/dashboard error:", err);
    res.status(500).send("Feil: " + err.message);
  }
});

// ---- GET /admin/annonser/ny – Show new farm form ----
router.get("/annonser/ny", isAdmin, (req, res) => {
  res.render("admin/new", { title: "Ny annonse – Admin" });
});

// ---- POST /admin/annonser – Save new farm ----
router.post("/annonser", isAdmin, async (req, res) => {
  try {
    const {
      title, description, ownerName, ownerDescription,
      municipality, fylke, address,
      sizeDekar, soilType, soilQuality,
      startingBid, rentalPeriodYears,
      auctionStart, auctionEnd, status,
    } = req.body;

    await Farm.create({
      title,
      description,
      ownerName,
      ownerDescription: ownerDescription || null,
      municipality,
      fylke,
      address: address || null,
      lat: 0,
      lng: 0,
      fieldPolygon: "",
      sizeDekar:         parseFloat(sizeDekar),
      soilType,
      soilQuality,
      soilComposition:   "",
      auctionStart:      new Date(auctionStart),
      auctionEnd:        new Date(auctionEnd),
      startingBid:       parseFloat(startingBid),
      currentBid:        0,
      rentalPeriodYears: parseInt(rentalPeriodYears),
      status,
    });

    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("POST /admin/annonser error:", err);
    res.status(500).send("Feil: " + err.message);
  }
});

// ---- GET /admin/annonser/:id/rediger – Show edit form ----
router.get("/annonser/:id/rediger", isAdmin, async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) return res.status(404).send("Annonsen ble ikke funnet.");
    res.render("admin/edit", { title: "Rediger annonse – Admin", farm });
  } catch (err) {
    console.error("GET /admin/annonser/:id/rediger error:", err);
    res.status(500).send("Feil: " + err.message);
  }
});

// ---- PUT /admin/annonser/:id – Update farm ----
router.put("/annonser/:id", isAdmin, async (req, res) => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const {
      title, description, ownerName, ownerDescription,
      municipality, fylke, address,
      sizeDekar, soilType, soilQuality,
      startingBid, rentalPeriodYears,
      auctionStart, auctionEnd, status,
    } = req.body;

    await prisma.farm.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title,
        description,
        ownerName,
        ownerDescription: ownerDescription || null,
        municipality,
        fylke,
        address: address || null,
        sizeDekar:         parseFloat(sizeDekar),
        soilType,
        soilQuality,
        auctionStart:      new Date(auctionStart),
        auctionEnd:        new Date(auctionEnd),
        startingBid:       parseFloat(startingBid),
        rentalPeriodYears: parseInt(rentalPeriodYears),
        status,
      },
    });

    await prisma.$disconnect();
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("PUT /admin/annonser/:id error:", err);
    res.status(500).send("Feil: " + err.message);
  }
});

// ---- DELETE /admin/annonser/:id – Delete farm ----
router.delete("/annonser/:id", isAdmin, async (req, res) => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const farmId = parseInt(req.params.id);
    // Delete related records first (foreign key constraints)
    await prisma.bid.deleteMany({ where: { farmId } });
    await prisma.farmCropType.deleteMany({ where: { farmId } });
    await prisma.farm.delete({ where: { id: farmId } });

    await prisma.$disconnect();
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("DELETE /admin/annonser/:id error:", err);
    res.status(500).send("Feil: " + err.message);
  }
});

module.exports = router;
