// ============================================================
// Jordleie.no - Main Application Entry Point
// Built with Express.js, EJS, and PostgreSQL via Prisma
// ============================================================

require("dotenv").config();
const express = require("express");
const methodOverride = require("method-override");
const path = require("path");
const prisma = require("./prisma/client");
const indexRoutes = require("./routes/index");
const farmRoutes = require("./routes/farms");

function createApp({ indexRouter = indexRoutes, farmRouter = farmRoutes } = {}) {
  const app = express();

  // ---- Middleware ----
  app.use(express.urlencoded({ extended: true })); // Parse form data
  app.use(express.json());                         // Parse JSON
  app.use(methodOverride("_method"));              // Support PUT/DELETE from forms
  app.use(express.static(path.join(__dirname, "public"))); // Serve static files

  // ---- View Engine ----
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  // ---- Routes ----
  app.use("/", indexRouter);
  app.use("/auksjoner", farmRouter);

  // ---- 404 Handler ----
  app.use((req, res) => {
    res.status(404).render("404", { title: "Side ikke funnet" });
  });

  return app;
}

function startServer({ app = createApp(), port = process.env.PORT || 3000 } = {}) {
  const server = app.listen(port, () => {
    console.log(`🚜 Jordleie.no kjører på http://localhost:${port}`);
  });

  async function shutdown() {
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return { app, server, shutdown };
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
