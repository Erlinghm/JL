// ============================================================
// Database – Node.js built-in SQLite (node:sqlite)
// No installation required, works out of the box with Node 22+
//
// DATABASE_URL in .env should be: file:./dev.db
// ============================================================

const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs   = require("fs");

// Resolve the path from DATABASE_URL env var ("file:./dev.db" → absolute path)
const rawUrl    = process.env.DATABASE_URL || "file:./dev.db";
const filePath  = rawUrl.replace(/^file:/, "");
const dbPath    = path.resolve(process.cwd(), filePath);

// Open (or create) the database file
const db = new DatabaseSync(dbPath);

// Enable WAL mode for better concurrent read performance
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// ---- Create tables if they don't exist yet ----------------

db.exec(`
  CREATE TABLE IF NOT EXISTS Farm (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    title             TEXT    NOT NULL,
    description       TEXT    NOT NULL,
    ownerName         TEXT    NOT NULL,
    ownerDescription  TEXT,

    municipality      TEXT    NOT NULL,
    fylke             TEXT    NOT NULL,
    address           TEXT,
    lat               REAL    NOT NULL DEFAULT 60.472,
    lng               REAL    NOT NULL DEFAULT 8.469,

    fieldPolygon      TEXT    NOT NULL DEFAULT '[]',

    sizeDekar         REAL    NOT NULL,
    soilType          TEXT    NOT NULL DEFAULT 'Leirjord',
    soilQuality       TEXT    NOT NULL DEFAULT 'God',
    soilComposition   TEXT    NOT NULL DEFAULT '{"leire":35,"sand":25,"silt":30,"organisk":10}',

    auctionStart      TEXT    NOT NULL,
    auctionEnd        TEXT    NOT NULL,
    startingBid       REAL    NOT NULL,
    currentBid        REAL    NOT NULL DEFAULT 0,
    rentalPeriodYears INTEGER NOT NULL DEFAULT 5,

    status            TEXT    NOT NULL DEFAULT 'aktiv',
    createdAt         TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS FarmCropType (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    farmId   INTEGER NOT NULL,
    cropType TEXT    NOT NULL,
    FOREIGN KEY (farmId) REFERENCES Farm(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Bid (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    farmId     INTEGER NOT NULL,
    bidderName TEXT    NOT NULL,
    amount     REAL    NOT NULL,
    createdAt  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (farmId) REFERENCES Farm(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_farmcroptype_farmid ON FarmCropType(farmId);
  CREATE INDEX IF NOT EXISTS idx_bid_farmid ON Bid(farmId);
`);

module.exports = db;
