// ============================================================
// Farm Model – PostgreSQL via Prisma
//
// Provides the same public API as before so all routes work
// unchanged:  find, findById, create, updateBid, deleteAll,
// insertMany, toView
// ============================================================

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
  const cropTypes = (row.cropTypes || []).map((ct) => ct.cropType);
  const bids = row.bids || [];
  return { ...row, _cropTypes: cropTypes, _bids: bids };
}

// ---- Query helpers ----------------------------------------

async function find(filter = {}, order = "auctionEnd") {
  const where = {};
  if (filter.fylke) where.fylke = filter.fylke;
  if (filter.status) where.status = filter.status;

  const farms = await prisma.farm.findMany({
    where,
    include: {
      cropTypes: true,
      bids: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { auctionEnd: "asc" },
  });

  return farms.map(hydrate).map(toView);
}

async function findById(id) {
  const farm = await prisma.farm.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      cropTypes: true,
      bids: { orderBy: { createdAt: "desc" } },
    },
  });
  return toView(hydrate(farm));
}

async function create(data) {
  const {
    cropTypes = [],
    title,
    description,
    ownerName,
    ownerDescription,
    municipality,
    fylke,
    address,
    lat,
    lng,
    fieldPolygon,
    sizeDekar,
    soilType,
    soilQuality,
    soilComposition,
    auctionStart,
    auctionEnd,
    startingBid,
    currentBid,
    rentalPeriodYears,
    status,
  } = data;

  const farm = await prisma.farm.create({
    data: {
      title,
      description,
      ownerName,
      ownerDescription: ownerDescription || null,
      municipality,
      fylke,
      address: address || null,
      lat: lat || 60.472,
      lng: lng || 8.469,
      fieldPolygon:
        typeof fieldPolygon === "string" ? fieldPolygon : JSON.stringify(fieldPolygon || []),
      sizeDekar,
      soilType: soilType || "Leirjord",
      soilQuality: soilQuality || "God",
      soilComposition:
        typeof soilComposition === "string"
          ? soilComposition
          : JSON.stringify(soilComposition || { leire: 35, sand: 25, silt: 30, organisk: 10 }),
      auctionStart,
      auctionEnd,
      startingBid: startingBid || 0,
      currentBid: currentBid || 0,
      rentalPeriodYears: rentalPeriodYears || 5,
      status: status || "aktiv",
    },
  });

  // Insert crop types
  for (const ct of cropTypes) {
    await prisma.farmCropType.create({
      data: {
        farmId: farm.id,
        cropType: ct,
      },
    });
  }

  return findById(farm.id);
}

async function updateBid(id, bidAmount, bidderName = "Anonym") {
  const farmId = parseInt(id, 10);

  // Record bid in history
  await prisma.bid.create({
    data: {
      farmId,
      bidderName,
      amount: bidAmount,
    },
  });

  // Update denormalized currentBid for fast reads
  await prisma.farm.update({
    where: { id: farmId },
    data: { currentBid: bidAmount },
  });

  return findById(farmId);
}

async function deleteAll() {
  await prisma.bid.deleteMany({});
  await prisma.farmCropType.deleteMany({});
  await prisma.farm.deleteMany({});
}

async function insertMany(farms) {
  for (const farmData of farms) {
    await create(farmData);
  }
}

module.exports = { find, findById, create, updateBid, deleteAll, insertMany, toView };
