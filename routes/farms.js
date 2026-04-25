// ============================================================
// Farm Routes – Auctions list and individual farm pages
// Database: PostgreSQL via Prisma
// ============================================================

const express = require("express");
const defaultFarm = require("../models/Farm");
const defaultAuth = require("../lib/auth");

function createFarmRouter({ Farm = defaultFarm, auth = defaultAuth } = {}) {
  const router = express.Router();

  // ---- GET /auksjoner – Show all farm listings with optional filters ----
  router.get("/", async (req, res) => {
    try {
      const { fylke } = req.query;

      // Build filter
      const filter = {};
      if (fylke && fylke !== "alle") filter.fylke = fylke;

      const farms = await Farm.find(filter, { auctionEnd: "asc" });

      // Marketplace stats (use all farms, not the filtered subset)
      const allFarms = await Farm.find({});
      const totalAuctions = allFarms.length;
      const avgDekar = allFarms.length
        ? Math.round(allFarms.reduce((sum, f) => sum + f.sizeDekar, 0) / allFarms.length)
        : 0;
      const avgBidPerDekar = allFarms.length
        ? Math.round(allFarms.reduce((sum, f) => sum + f.startingBid, 0) / allFarms.length)
        : 0;

      // All unique fylker for filter dropdown
      const allFylker = [...new Set(allFarms.map((f) => f.fylke))].sort();

      res.render("auctions", {
        title: "Auksjoner – Jordleie.no",
        farms,
        totalAuctions,
        avgDekar,
        avgBidPerDekar,
        allFylker,
        selectedFylke: fylke || "alle",
      });
    } catch (err) {
      console.error("GET /auksjoner error:", err);
      const isPrismaError = err.message?.includes("prisma") || err.code?.startsWith("P");
      res.status(500).render("error", {
        title: "Feil – Jordleie.no",
        message: "Kunne ikke hente auksjoner fra databasen.",
        hint: isPrismaError
          ? "Sjekk at DATABASE_URL i .env er riktig, og at du har kjørt: npx prisma migrate dev && node seed.js"
          : err.message,
      });
    }
  });

  // ---- GET /auksjoner/:id – Show a single farm ----
  router.get("/:id", async (req, res) => {
    try {
      const farm = await Farm.findById(req.params.id);
      if (!farm) {
        return res.status(404).render("404", { title: "Ikke funnet" });
      }
      res.render("farm", { title: farm.title + " – Jordleie.no", farm });
    } catch (err) {
      console.error("GET /auksjoner/:id error:", err);
      res.status(500).render("error", {
        title: "Feil – Jordleie.no",
        message: "Kunne ikke hente gårdsannonsen.",
        hint: err.message,
      });
    }
  });

  // ---- POST /auksjoner – Create a new farm listing ----
  router.post("/", auth.requireAuth, async (req, res) => {
    try {
      const {
        title, description, ownerName, ownerDescription,
        municipality, fylke, address,
        lat, lng, fieldPolygon,
        sizeDekar, soilType, soilQuality,
        auctionStart, auctionEnd, startingBid, rentalPeriodYears,
        cropTypes,
      } = req.body;

      const farm = await Farm.create({
        title,
        description,
        ownerUserId: req.currentUser.id,
        ownerName: req.currentUser.fullName || ownerName,
        ownerDescription: ownerDescription || null,
        municipality,
        fylke,
        address: address || null,
        lat: parseFloat(lat) || 60.472,
        lng: parseFloat(lng) || 8.469,
        fieldPolygon: fieldPolygon || "[]",
        sizeDekar: parseFloat(sizeDekar),
        soilType: soilType || "Leirjord",
        soilQuality: soilQuality || "God",
        auctionStart: new Date(auctionStart),
        auctionEnd: new Date(auctionEnd),
        startingBid: parseFloat(startingBid),
        rentalPeriodYears: parseInt(rentalPeriodYears, 10) || 5,
        cropTypes: Array.isArray(cropTypes)
          ? cropTypes
          : cropTypes
            ? [cropTypes]
            : [],
      });

      res.redirect("/auksjoner/" + farm.id);
    } catch (err) {
      console.error("POST /auksjoner error:", err);
      res.status(500).render("error", {
        title: "Feil – Jordleie.no",
        message: "Kunne ikke opprette annonsen.",
        hint: err.message,
      });
    }
  });

  // ---- POST /auksjoner/:id/bid – Place a bid ----
  router.post("/:id/bid", auth.requireAuth, async (req, res) => {
    try {
      const farm = await Farm.findById(req.params.id);
      if (!farm) return res.status(404).send("Ikke funnet");
      if (farm.status !== "aktiv") {
        return res.status(400).render("error", {
          title: "Bud stengt – Jordleie.no",
          message: "Auksjonen er ikke åpen for bud.",
          hint: farm.status === "avsluttet"
            ? "Auksjonen er avsluttet og kan ikke motta flere bud."
            : "Auksjonen er ikke aktiv ennå.",
        });
      }

      const bidAmount = parseFloat(req.body.bidAmount);

      if (bidAmount > farm.currentBid || farm.currentBid === 0) {
        await Farm.updateBid(farm.id, bidAmount, req.currentUser.fullName || "Anonym", req.currentUser.id);
      }

      res.redirect("/auksjoner/" + farm.id);
    } catch (err) {
      console.error("POST /auksjoner/:id/bid error:", err);
      res.status(500).render("error", {
        title: "Feil – Jordleie.no",
        message: "Kunne ikke registrere budet.",
        hint: err.message,
      });
    }
  });

  return router;
}

const router = createFarmRouter();

module.exports = router;
module.exports.createFarmRouter = createFarmRouter;
