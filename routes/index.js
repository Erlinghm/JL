// ============================================================
// Index Routes - Home page and static pages
// ============================================================

const express = require("express");
const router  = express.Router();

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
router.post("/kontakt", (req, res) => {
  // TODO: send email via Nodemailer or similar
  res.redirect("/kontakt?sendt=true");
});

// Login page
router.get("/logg-inn", (req, res) => {
  res.render("login", { title: "Logg inn – Jordleie.no" });
});

// Min bruker (My profile / create listing)
router.get("/min-bruker", (req, res) => {
  res.render("my-profile", { title: "Min bruker" });
});

// Lag annonse (Create listing)
router.get("/lag-annonse", (req, res) => {
  res.render("create-listing", { title: "Lag annonse" });
});

module.exports = router;
