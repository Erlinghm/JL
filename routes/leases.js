// ============================================================
// Lease Routes
//
// GET  /avtaler               – Liste over mine avtaler
// GET  /avtaler/:id           – Vis enkeltavtale (pre-fylt + manuelle felt)
// POST /avtaler/:id           – Lagre manuelle felt i contractDataJson
// POST /auksjoner/:id/avslutt – Avslutt auksjon + opprett Lease frå vinnande bod
// ============================================================

const express = require("express");
const defaultLease = require("../models/Lease");
const defaultAuth = require("../lib/auth");

function createLeaseRouter({ Lease = defaultLease, auth = defaultAuth } = {}) {
  const router = express.Router();

  // Liste over mine avtaler (både som eigar og leigetakar)
  router.get("/avtaler", auth.requireAuth, async (req, res) => {
    try {
      const leases = await Lease.findForUser(req.currentUser.id);
      res.render("leases", { title: "Mine avtaler", leases });
    } catch (err) {
      console.error("GET /avtaler error:", err);
      res.status(500).render("error", {
        title: "Feil – Jordleie.no",
        message: "Kunne ikkje hente avtalene dine.",
        hint: err.message,
      });
    }
  });

  // Vis enkeltavtale
  router.get("/avtaler/:id", auth.requireAuth, async (req, res) => {
    try {
      const lease = await Lease.findById(req.params.id);
      if (!lease) return res.status(404).render("404", { title: "Ikkje funnet" });
      if (lease.owner.id !== req.currentUser.id && lease.tenant.id !== req.currentUser.id) {
        return res.status(403).render("error", {
          title: "Ingen tilgang",
          message: "Du har ikkje tilgang til denne avtalen.",
          hint: "Berre partane i avtalen kan sjå den.",
        });
      }
      res.render("lease", {
        title: `Avtale #${lease.id} – Jordleie.no`,
        lease,
        currentUserId: req.currentUser.id,
        success: req.query.success || null,
        error: req.query.error || null,
      });
    } catch (err) {
      console.error("GET /avtaler/:id error:", err);
      res.status(500).render("error", {
        title: "Feil – Jordleie.no",
        message: "Kunne ikkje hente avtalen.",
        hint: err.message,
      });
    }
  });

  // Lagre manuelle felt
  router.post("/avtaler/:id", auth.requireAuth, async (req, res) => {
    try {
      const { otherTerms, specialLeaseTerms, signingPlace } = req.body;
      await Lease.updateContractData(req.params.id, req.currentUser.id, {
        otherTerms: otherTerms ? String(otherTerms).trim() : null,
        specialLeaseTerms: specialLeaseTerms ? String(specialLeaseTerms).trim() : null,
        signingPlace: signingPlace ? String(signingPlace).trim() : null,
      });
      res.redirect(`/avtaler/${req.params.id}?success=${encodeURIComponent("Avtalen er oppdatert.")}`);
    } catch (err) {
      console.error("POST /avtaler/:id error:", err);
      res.redirect(`/avtaler/${req.params.id}?error=${encodeURIComponent(err.message)}`);
    }
  });

  // Avslutt auksjon og opprett avtale frå vinnande bod
  // Brukast frå farm.ejs "Avslutt auksjon og opprett avtale"-knappen
  router.post("/auksjoner/:id/avslutt", auth.requireAuth, async (req, res) => {
    try {
      const leaseId = await Lease.createFromListing(req.params.id, {
        userId: req.currentUser.id,
      });
      res.redirect(`/avtaler/${leaseId}`);
    } catch (err) {
      console.error("POST /auksjoner/:id/avslutt error:", err);
      res.redirect(`/auksjoner/${req.params.id}?error=${encodeURIComponent(err.message)}`);
    }
  });

  return router;
}

const router = createLeaseRouter();

module.exports = router;
module.exports.createLeaseRouter = createLeaseRouter;
