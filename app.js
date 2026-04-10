// ============================================================
// Jordleie.no - Main Application Entry Point
// Built with Express.js, EJS, and PostgreSQL via Prisma
// ============================================================

require("dotenv").config();
const express = require("express");
const methodOverride = require("method-override");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middleware ----
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.json());                          // Parse JSON
app.use(methodOverride("_method"));              // Support PUT/DELETE from forms
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

// ---- View Engine ----
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---- Session ----
const session = require("express-session");
app.use(session({
  secret: process.env.SESSION_SECRET || "midlertidig-hemmelighet",
  resave: false,
  saveUninitialized: false,
}));

// ---- Routes ----
const indexRoutes = require("./routes/index");
const farmRoutes  = require("./routes/farms");
const adminRoutes = require("./routes/admin");

app.use("/", indexRoutes);
app.use("/auksjoner", farmRoutes);
app.use("/admin", adminRoutes);

// ---- 404 Handler ----
app.use((req, res) => {
  res.status(404).render("404", { title: "Side ikke funnet" });
});

// ---- Start Server ----
const server = app.listen(PORT, () => {
  console.log(`🚜 Jordleie.no kjører på http://localhost:${PORT}`);
});

// ---- Graceful shutdown – close Prisma connection ----
async function shutdown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
