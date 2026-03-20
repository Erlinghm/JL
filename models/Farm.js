// ============================================================
// Farm Model – Node.js built-in SQLite (node:sqlite)
//
// Provides the same public API as before so all routes work
// unchanged:  find, findById, create, updateBid, deleteAll,
// insertMany, toView
// ============================================================

const db = require("../prisma/db");

// ---- Helpers ----------------------------------------------

/** Parse a JSON string field; return fallback if it fails. */
function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

/**
 * Convert a raw DB row into the shape EJS views expect:
 *   farm._id       → numeric id (compatible with existing view links)
 *   farm.cropTypes → ["korn", "bygg", ...] (flat string array)
 *   farm.fieldPolygon / soilComposition → parsed JS objects
 */
function toView(row) {
  if (!row) return null;
  return {
    ...row,
    _id:            row.id,
    cropTypes:      row._cropTypes ?? [],
    fieldPolygon:   parseJson(row.fieldPolygon, []),
    soilComposition: parseJson(row.soilComposition, {}),
    auctionStart:   new Date(row.auctionStart),
    auctionEnd:     new Date(row.auctionEnd),
    bids:           row._bids ?? [],
  };
}

/** Attach cropTypes and bids arrays to a farm row. */
function hydrate(row) {
  if (!row) return null;
  const cropTypes = db
    .prepare("SELECT cropType FROM FarmCropType WHERE farmId = ? ORDER BY id")
    .all(row.id)
    .map((r) => r.cropType);

  const bids = db
    .prepare("SELECT * FROM Bid WHERE farmId = ? ORDER BY createdAt DESC")
    .all(row.id);

  return { ...row, _cropTypes: cropTypes, _bids: bids };
}

// ---- Query helpers ----------------------------------------

function find(filter = {}, order = "auctionEnd") {
  let sql  = "SELECT * FROM Farm";
  const params = [];

  if (filter.fylke) {
    sql += " WHERE fylke = ?";
    params.push(filter.fylke);
  }
  if (filter.status) {
    sql += filter.fylke ? " AND status = ?" : " WHERE status = ?";
    params.push(filter.status);
  }

  sql += " ORDER BY auctionEnd ASC";

  const rows = db.prepare(sql).all(...params);
  return rows.map(hydrate).map(toView);
}

function findById(id) {
  const row = db.prepare("SELECT * FROM Farm WHERE id = ?").get(parseInt(id, 10));
  return toView(hydrate(row));
}

function create(data) {
  const {
    cropTypes = [],
    title, description, ownerName, ownerDescription,
    municipality, fylke, address,
    lat, lng, fieldPolygon,
    sizeDekar, soilType, soilQuality, soilComposition,
    auctionStart, auctionEnd, startingBid, currentBid,
    rentalPeriodYears, status,
  } = data;

  const result = db.prepare(`
    INSERT INTO Farm (
      title, description, ownerName, ownerDescription,
      municipality, fylke, address, lat, lng,
      fieldPolygon, sizeDekar, soilType, soilQuality, soilComposition,
      auctionStart, auctionEnd, startingBid, currentBid,
      rentalPeriodYears, status
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?
    )
  `).run(
    title,
    description,
    ownerName,
    ownerDescription ?? null,
    municipality,
    fylke,
    address ?? null,
    lat ?? 60.472,
    lng ?? 8.469,
    typeof fieldPolygon === "string" ? fieldPolygon : JSON.stringify(fieldPolygon ?? []),
    sizeDekar,
    soilType ?? "Leirjord",
    soilQuality ?? "God",
    typeof soilComposition === "string"
      ? soilComposition
      : JSON.stringify(soilComposition ?? { leire: 35, sand: 25, silt: 30, organisk: 10 }),
    auctionStart instanceof Date ? auctionStart.toISOString() : (auctionStart ?? new Date().toISOString()),
    auctionEnd instanceof Date   ? auctionEnd.toISOString()   : (auctionEnd   ?? new Date().toISOString()),
    startingBid ?? 0,
    currentBid  ?? 0,
    rentalPeriodYears ?? 5,
    status ?? "aktiv",
  );

  const farmId = result.lastInsertRowid;

  // Insert crop types
  const insertCrop = db.prepare("INSERT INTO FarmCropType (farmId, cropType) VALUES (?, ?)");
  for (const ct of cropTypes) {
    insertCrop.run(farmId, ct);
  }

  return findById(farmId);
}

function updateBid(id, bidAmount, bidderName = "Anonym") {
  const farmId = parseInt(id, 10);

  // Record bid in history
  db.prepare(
    "INSERT INTO Bid (farmId, bidderName, amount) VALUES (?, ?, ?)"
  ).run(farmId, bidderName, bidAmount);

  // Update denormalized currentBid for fast reads
  db.prepare(
    "UPDATE Farm SET currentBid = ? WHERE id = ?"
  ).run(bidAmount, farmId);

  return findById(farmId);
}

function deleteAll() {
  db.exec("DELETE FROM FarmCropType; DELETE FROM Bid; DELETE FROM Farm;");
}

function insertMany(farms) {
  for (const farmData of farms) {
    create(farmData);
  }
}

module.exports = { find, findById, create, updateBid, deleteAll, insertMany, toView };
