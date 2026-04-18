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
      res.render("farm", {
        title: farm.title + " – Jordleie.no",
        farm,
        error: req.query.error || null,
        success: req.query.success || null,
      });
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
        areaFulldyrka, areaOverflatedyrka, areaInnmarksbeite, areaAnna,
        auctionStart, auctionEnd, startingBid, rentalPeriodYears,
        cropTypes,
        matrikkelGnr, matrikkelBnr, matrikkelNote,
        paymentDueDate, firstDueDate, vatApplies,
        indexType, indexStartYear, indexBaseYear,
        hasFloghavre, hasConditionReport, hasSoilSamples, hasFertilizerPlan,
        conditionNotes, additionalTerms, specialTerms,
      } = req.body;

      // Normaliser matrikkel-rader til array av objekter
      const gnrArr = Array.isArray(matrikkelGnr) ? matrikkelGnr : matrikkelGnr ? [matrikkelGnr] : [];
      const bnrArr = Array.isArray(matrikkelBnr) ? matrikkelBnr : matrikkelBnr ? [matrikkelBnr] : [];
      const noteArr = Array.isArray(matrikkelNote) ? matrikkelNote : matrikkelNote ? [matrikkelNote] : [];
      const matrikler = [];
      const maxLen = Math.max(gnrArr.length, bnrArr.length, noteArr.length);
      for (let i = 0; i < maxLen; i++) {
        const gnr = gnrArr[i] ? parseInt(gnrArr[i], 10) : null;
        const bnr = bnrArr[i] ? parseInt(bnrArr[i], 10) : null;
        const note = noteArr[i] ? String(noteArr[i]).trim() : null;
        if (gnr || bnr || note) matrikler.push({ gnr, bnr, matrikkelNote: note });
      }

      // Parse tri-state checkbox for floghavre ("true"/"false"/"" = null)
      const floghavre =
        hasFloghavre === "true" ? true : hasFloghavre === "false" ? false : null;

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
        sizeDekar: parseFloat(sizeDekar) || 0,
        areaFulldyrka: parseFloat(areaFulldyrka) || 0,
        areaOverflatedyrka: parseFloat(areaOverflatedyrka) || 0,
        areaInnmarksbeite: parseFloat(areaInnmarksbeite) || 0,
        areaAnna: parseFloat(areaAnna) || 0,
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
        matrikler,
        paymentDueDate: paymentDueDate ? String(paymentDueDate).trim() : null,
        firstDueDate: firstDueDate ? new Date(firstDueDate) : null,
        vatApplies: vatApplies === "true",
        indexRegulation: Boolean(indexType && String(indexType).trim()),
        indexType: indexType ? String(indexType).trim() || null : null,
        indexStartYear: indexStartYear ? parseInt(indexStartYear, 10) : null,
        indexBaseYear: indexBaseYear ? parseInt(indexBaseYear, 10) : null,
        hasFloghavre: floghavre,
        hasConditionReport: hasConditionReport === "true",
        hasSoilSamples: hasSoilSamples === "true",
        hasFertilizerPlan: hasFertilizerPlan === "true",
        conditionNotes: conditionNotes ? String(conditionNotes).trim() : null,
        additionalTerms: additionalTerms ? String(additionalTerms).trim() : null,
        specialTerms: specialTerms ? String(specialTerms).trim() : null,
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
