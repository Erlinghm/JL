const defaultPrisma = require("../prisma/client");

const DEFAULT_LAT = 60.472;
const DEFAULT_LNG = 8.469;
const DEFAULT_SOIL_TYPE = "Leirjord";
const DEFAULT_SOIL_QUALITY = "God";
const DEFAULT_SOIL_COMPOSITION = { leire: 35, sand: 25, silt: 30, organisk: 10 };
const SCHEDULABLE_LISTING_STATUSES = ["PUBLISHED", "UPCOMING", "ACTIVE"];
const CLOSED_LISTING_STATUSES = new Set(["DRAFT", "ENDED", "AWARDED", "CANCELLED"]);

const listingInclude = {
  owner: { include: { profile: true } },
  farm: {
    include: {
      owner: { include: { profile: true } },
      parcels: true,
      cropTypes: { include: { cropType: true } },
    },
  },
  bids: {
    include: { bidder: true },
    orderBy: { createdAt: "desc" },
  },
};

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "bruker";
}

function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

function sumArea(parcels = []) {
  return parcels.reduce((sum, parcel) => sum + (Number(parcel.areaDekar) || 0), 0);
}

function listingStatusFromInput(status, auctionStartAt, auctionEndAt) {
  let requestedStatus = null;

  if (status) {
    const raw = String(status).trim().toLowerCase();
    if (raw === "draft" || raw === "utkast") requestedStatus = "DRAFT";
    if (raw === "published" || raw === "publisert") requestedStatus = "PUBLISHED";
    if (raw === "upcoming" || raw === "kommende") requestedStatus = "UPCOMING";
    if (raw === "active" || raw === "aktiv") requestedStatus = "ACTIVE";
    if (raw === "ended" || raw === "avsluttet") requestedStatus = "ENDED";
    if (raw === "awarded" || raw === "tildelt") requestedStatus = "AWARDED";
    if (raw === "cancelled" || raw === "kansellert") requestedStatus = "CANCELLED";
  }

  if (requestedStatus && CLOSED_LISTING_STATUSES.has(requestedStatus)) {
    return requestedStatus;
  }

  const now = new Date();
  if (auctionStartAt > now) return "UPCOMING";
  if (auctionEndAt <= now) return "ENDED";
  return "ACTIVE";
}

function effectiveListingStatus(listing, now = new Date()) {
  if (!listing) return null;
  if (CLOSED_LISTING_STATUSES.has(listing.status)) return listing.status;

  const auctionStartAt = new Date(listing.auctionStartAt);
  const auctionEndAt = new Date(listing.auctionEndAt);

  if (!Number.isNaN(auctionEndAt.getTime()) && auctionEndAt <= now) return "ENDED";
  if (!Number.isNaN(auctionStartAt.getTime()) && auctionStartAt > now) return "UPCOMING";
  return "ACTIVE";
}

function viewStatusFromListing(status) {
  switch (status) {
    case "UPCOMING":
    case "DRAFT":
      return "kommende";
    case "ENDED":
    case "AWARDED":
    case "CANCELLED":
      return "avsluttet";
    default:
      return "aktiv";
  }
}

function toView(listing) {
  if (!listing) return null;

  const effectiveStatus = effectiveListingStatus(listing);
  const farm = listing.farm || {};
  const owner = farm.owner || listing.owner || {};
  const profile = owner.profile || {};
  const parcels = farm.parcels || [];
  const firstParcel = parcels[0] || {};
  const fieldPolygon = parseJson(firstParcel.polygonJson, []);
  const soilComposition = parseJson(firstParcel.soilCompositionJson, DEFAULT_SOIL_COMPOSITION);
  const sizeDekar = sumArea(parcels);
  const bids = (listing.bids || []).map((bid) => ({
    id: bid.id,
    bidderName: bid.bidder?.fullName || "Anonym",
    amount: bid.amountPerDekarYear,
    status: bid.status,
    createdAt: bid.createdAt,
  }));

  return {
    id: listing.id,
    _id: listing.id,
    farmId: farm.id,
    title: farm.title,
    description: farm.description,
    ownerName: owner.fullName || "Ukjent",
    ownerDescription: profile.bio || null,
    municipality: farm.municipality,
    fylke: farm.county,
    address: farm.address || null,
    lat: farm.centroidLat ?? DEFAULT_LAT,
    lng: farm.centroidLng ?? DEFAULT_LNG,
    fieldPolygon,
    sizeDekar,
    soilType: farm.soilType || DEFAULT_SOIL_TYPE,
    soilQuality: farm.soilQuality || DEFAULT_SOIL_QUALITY,
    soilComposition,
    auctionStart: listing.auctionStartAt,
    auctionEnd: listing.auctionEndAt,
    startingBid: listing.startingBidPerDekarYear,
    currentBid: listing.currentBidPerDekarYear,
    rentalPeriodYears: listing.rentalPeriodYears,
    status: viewStatusFromListing(effectiveStatus),
    cropTypes: (farm.cropTypes || []).map((link) => link.cropType.name),
    bids,
    createdAt: listing.createdAt,
  };
}

function createFarmModel(prisma = defaultPrisma) {
  async function syncAuctionStatuses(tx = prisma, now = new Date()) {
    if (!tx.listing?.updateMany) return;

    await tx.listing.updateMany({
      where: {
        status: { in: SCHEDULABLE_LISTING_STATUSES },
        auctionEndAt: { lte: now },
      },
      data: { status: "ENDED" },
    });

    await tx.listing.updateMany({
      where: {
        status: { in: ["PUBLISHED", "UPCOMING"] },
        auctionStartAt: { lte: now },
        auctionEndAt: { gt: now },
      },
      data: { status: "ACTIVE" },
    });

    await tx.listing.updateMany({
      where: {
        status: { in: ["PUBLISHED", "ACTIVE"] },
        auctionStartAt: { gt: now },
      },
      data: { status: "UPCOMING" },
    });
  }

  async function ensureShadowUser(tx, { fullName, role, county, bio, verificationType }) {
    const normalizedName = String(fullName || "Anonym").trim() || "Anonym";
    const email = `${slugify(normalizedName)}-${role.toLowerCase()}@jordleie.invalid`;
    const user = await tx.user.upsert({
      where: { email },
      update: {
        fullName: normalizedName,
        role,
        status: role === "OWNER" ? "PENDING_VERIFICATION" : "ACTIVE",
        profile: {
          upsert: {
            update: {
              county: county || null,
              bio: bio || undefined,
            },
            create: {
              county: county || null,
              bio: bio || null,
            },
          },
        },
      },
      create: {
        email,
        fullName: normalizedName,
        role,
        status: role === "OWNER" ? "PENDING_VERIFICATION" : "ACTIVE",
        profile: {
          create: {
            county: county || null,
            bio: bio || null,
          },
        },
      },
      include: { profile: true },
    });

    if (verificationType) {
      await tx.userVerification.upsert({
        where: {
          userId_type: {
            userId: user.id,
            type: verificationType,
          },
        },
        update: {},
        create: {
          userId: user.id,
          type: verificationType,
          status: role === "OWNER" ? "PENDING" : "VERIFIED",
        },
      });
    }

    return user;
  }

  async function resolveOwnerUser(tx, { ownerUserId, ownerName, ownerDescription, fylke }) {
    if (!ownerUserId) {
      return ensureShadowUser(tx, {
        fullName: ownerName,
        role: "OWNER",
        county: fylke,
        bio: ownerDescription,
        verificationType: "LANDOWNER",
      });
    }

    return tx.user.update({
      where: { id: Number(ownerUserId) },
      data: {
        fullName: String(ownerName || "").trim() || undefined,
        profile: {
          upsert: {
            update: {
              county: fylke || null,
              bio: ownerDescription || undefined,
            },
            create: {
              county: fylke || null,
              bio: ownerDescription || null,
            },
          },
        },
      },
      include: { profile: true },
    });
  }

  async function resolveBidderUser(tx, { bidderUserId, bidderName, county }) {
    if (!bidderUserId) {
      return ensureShadowUser(tx, {
        fullName: bidderName,
        role: "TENANT",
        county,
        verificationType: "FARMER",
      });
    }

    return tx.user.findUniqueOrThrow({
      where: { id: Number(bidderUserId) },
    });
  }

  async function ensureCropLinks(tx, farmId, cropTypes = []) {
    const uniqueCropTypes = [...new Set((cropTypes || []).map((crop) => String(crop).trim()).filter(Boolean))];

    for (const cropTypeName of uniqueCropTypes) {
      const slug = slugify(cropTypeName);
      const cropType = await tx.cropType.upsert({
        where: { slug },
        update: { name: cropTypeName },
        create: { slug, name: cropTypeName },
      });

      await tx.farmCropType.upsert({
        where: {
          farmId_cropTypeId: {
            farmId,
            cropTypeId: cropType.id,
          },
        },
        update: {},
        create: {
          farmId,
          cropTypeId: cropType.id,
        },
      });
    }
  }

  async function find(filter = {}) {
    await syncAuctionStatuses();

    const where = {};

    if (filter.fylke) {
      where.farm = { is: { county: filter.fylke } };
    }

    if (filter.status) {
      where.status = listingStatusFromInput(filter.status, new Date(), new Date(Date.now() + 1));
    }

    const listings = await prisma.listing.findMany({
      where,
      include: listingInclude,
      orderBy: { auctionEndAt: "asc" },
    });

    return listings.map(toView);
  }

  async function findById(id) {
    await syncAuctionStatuses();

    const listing = await prisma.listing.findUnique({
      where: { id: parseInt(id, 10) },
      include: listingInclude,
    });

    return toView(listing);
  }

  async function create(data) {
    const {
      cropTypes = [],
      ownerUserId,
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

    const auctionStartAt = new Date(auctionStart);
    const auctionEndAt = new Date(auctionEnd);

    if (Number.isNaN(auctionStartAt.getTime()) || Number.isNaN(auctionEndAt.getTime())) {
      throw new Error("Auksjonsdatoene er ugyldige.");
    }

    if (auctionEndAt <= auctionStartAt) {
      throw new Error("Auksjonen må slutte etter at den starter.");
    }

    const listingStatus = listingStatusFromInput(status, auctionStartAt, auctionEndAt);
    const polygon = parseJson(fieldPolygon, []);
    const composition = parseJson(soilComposition, DEFAULT_SOIL_COMPOSITION);

    const listing = await prisma.$transaction(async (tx) => {
      const owner = await resolveOwnerUser(tx, {
        ownerUserId,
        ownerName,
        ownerDescription,
        fylke,
      });

      const farm = await tx.farm.create({
        data: {
          ownerUserId: owner.id,
          title,
          description,
          municipality,
          county: fylke,
          address: address || null,
          centroidLat: Number(lat) || DEFAULT_LAT,
          centroidLng: Number(lng) || DEFAULT_LNG,
          soilType: soilType || DEFAULT_SOIL_TYPE,
          soilQuality: soilQuality || DEFAULT_SOIL_QUALITY,
        },
      });

      await tx.farmParcel.create({
        data: {
          farmId: farm.id,
          name: title,
          areaDekar: Number(sizeDekar) || 0,
          polygonJson: polygon,
          soilCompositionJson: composition,
        },
      });

      await ensureCropLinks(tx, farm.id, cropTypes);

      return tx.listing.create({
        data: {
          farmId: farm.id,
          ownerUserId: owner.id,
          status: listingStatus,
          rentalPeriodYears: Number(rentalPeriodYears) || 5,
          startingBidPerDekarYear: Number(startingBid) || 0,
          currentBidPerDekarYear: Number(currentBid) || 0,
          auctionStartAt,
          auctionEndAt,
          publishedAt: new Date(),
        },
      });
    });

    return model.findById(listing.id);
  }

  async function update(id, data) {
    const listingId = parseInt(id, 10);
    const {
      cropTypes,
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

    const auctionStartAt = new Date(auctionStart);
    const auctionEndAt = new Date(auctionEnd);

    if (Number.isNaN(auctionStartAt.getTime()) || Number.isNaN(auctionEndAt.getTime())) {
      throw new Error("Auksjonsdatoene er ugyldige.");
    }

    if (auctionEndAt <= auctionStartAt) {
      throw new Error("Auksjonen må slutte etter at den starter.");
    }

    const listingStatus = listingStatusFromInput(status, auctionStartAt, auctionEndAt);

    await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({
        where: { id: listingId },
        include: {
          farm: {
            include: {
              parcels: true,
            },
          },
        },
      });

      if (!listing) {
        throw new Error("Auksjonen finnes ikke.");
      }

      const owner = await resolveOwnerUser(tx, {
        ownerUserId: listing.ownerUserId,
        ownerName,
        ownerDescription,
        fylke,
      });

      const firstParcel = listing.farm.parcels[0] || null;
      const polygon = parseJson(
        fieldPolygon,
        firstParcel?.polygonJson || []
      );
      const composition = parseJson(
        soilComposition,
        firstParcel?.soilCompositionJson || DEFAULT_SOIL_COMPOSITION
      );

      await tx.farm.update({
        where: { id: listing.farmId },
        data: {
          ownerUserId: owner.id,
          title,
          description,
          municipality,
          county: fylke,
          address: address || null,
          centroidLat: lat === undefined || lat === "" ? listing.farm.centroidLat : Number(lat),
          centroidLng: lng === undefined || lng === "" ? listing.farm.centroidLng : Number(lng),
          soilType: soilType || DEFAULT_SOIL_TYPE,
          soilQuality: soilQuality || DEFAULT_SOIL_QUALITY,
        },
      });

      if (firstParcel) {
        await tx.farmParcel.update({
          where: { id: firstParcel.id },
          data: {
            name: title,
            areaDekar: Number(sizeDekar) || 0,
            polygonJson: polygon,
            soilCompositionJson: composition,
          },
        });
      } else {
        await tx.farmParcel.create({
          data: {
            farmId: listing.farmId,
            name: title,
            areaDekar: Number(sizeDekar) || 0,
            polygonJson: polygon,
            soilCompositionJson: composition,
          },
        });
      }

      if (cropTypes !== undefined) {
        const normalizedCropTypes = Array.isArray(cropTypes)
          ? cropTypes
          : cropTypes
            ? [cropTypes]
            : [];

        await tx.farmCropType.deleteMany({ where: { farmId: listing.farmId } });
        await ensureCropLinks(tx, listing.farmId, normalizedCropTypes);
      }

      await tx.listing.update({
        where: { id: listingId },
        data: {
          ownerUserId: owner.id,
          status: listingStatus,
          rentalPeriodYears: Number(rentalPeriodYears) || 5,
          startingBidPerDekarYear: Number(startingBid) || 0,
          currentBidPerDekarYear: currentBid === undefined ? listing.currentBidPerDekarYear : Number(currentBid) || 0,
          auctionStartAt,
          auctionEndAt,
          publishedAt: listing.publishedAt || new Date(),
        },
      });
    });

    return model.findById(listingId);
  }

  async function deleteById(id) {
    const listingId = parseInt(id, 10);

    await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({
        where: { id: listingId },
        select: { farmId: true },
      });

      if (!listing) {
        throw new Error("Auksjonen finnes ikke.");
      }

      await tx.listing.delete({ where: { id: listingId } });

      const remainingListings = await tx.listing.count({
        where: { farmId: listing.farmId },
      });

      if (remainingListings === 0) {
        await tx.farm.delete({ where: { id: listing.farmId } });
      }
    });
  }

  async function updateBid(id, bidAmount, bidderName = "Anonym", bidderUserId = null) {
    const listingId = parseInt(id, 10);
    const amount = Number(bidAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Budet må være større enn 0.");
    }

    await prisma.$transaction(async (tx) => {
      const now = new Date();
      await syncAuctionStatuses(tx, now);

      const listing = await tx.listing.findUnique({
        where: { id: listingId },
        include: {
          farm: {
            include: {
              parcels: true,
            },
          },
        },
      });

      if (!listing) {
        throw new Error("Auksjonen finnes ikke.");
      }

      if (effectiveListingStatus(listing, now) !== "ACTIVE") {
        throw new Error("Auksjonen er avsluttet og kan ikke motta flere bud.");
      }

      const minimumBid =
        listing.currentBidPerDekarYear > 0
          ? listing.currentBidPerDekarYear + 1
          : listing.startingBidPerDekarYear;

      if (amount < minimumBid) {
        throw new Error("Budet må være høyere enn gjeldende minstepris.");
      }

      const bidder = await resolveBidderUser(tx, {
        bidderUserId,
        bidderName,
        county: listing.farm.county,
      });

      await tx.bid.updateMany({
        where: {
          listingId,
          status: {
            in: ["VALID", "WINNING"],
          },
        },
        data: {
          status: "OUTBID",
        },
      });

      await tx.bid.create({
        data: {
          listingId,
          bidderUserId: bidder.id,
          amountPerDekarYear: amount,
          totalAmountPerYear: amount * sumArea(listing.farm.parcels),
          status: "WINNING",
        },
      });

      await tx.listing.update({
        where: { id: listingId },
        data: {
          currentBidPerDekarYear: amount,
        },
      });
    });

    return model.findById(listingId);
  }

  async function deleteAll() {
    await prisma.message.deleteMany({});
    await prisma.conversationParticipant.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.lease.deleteMany({});
    await prisma.bid.deleteMany({});
    await prisma.listing.deleteMany({});
    await prisma.farmCropType.deleteMany({});
    await prisma.cropType.deleteMany({});
    await prisma.farmParcel.deleteMany({});
    await prisma.farm.deleteMany({});
    await prisma.userVerification.deleteMany({});
    await prisma.userProfile.deleteMany({});
    await prisma.contactSubmission.deleteMany({});
    await prisma.user.deleteMany({});
  }

  async function insertMany(farms) {
    for (const farmData of farms) {
      await model.create(farmData);
    }
  }

  const model = { find, findById, create, update, deleteById, updateBid, deleteAll, insertMany, toView, syncAuctionStatuses };

  return model;
}

const farmModel = createFarmModel();

module.exports = farmModel;
module.exports.createFarmModel = createFarmModel;
module.exports.toView = toView;
module.exports.effectiveListingStatus = effectiveListingStatus;
