const test = require("node:test");
const assert = require("node:assert/strict");

const { createFarmModel, toView } = require("../../models/Farm");

function buildListing(overrides = {}) {
  return {
    id: 10,
    status: "ACTIVE",
    auctionStartAt: new Date("2026-04-01T00:00:00.000Z"),
    auctionEndAt: new Date("2026-04-10T00:00:00.000Z"),
    startingBidPerDekarYear: 650,
    currentBidPerDekarYear: 710,
    rentalPeriodYears: 5,
    createdAt: new Date("2026-03-01T00:00:00.000Z"),
    owner: {
      fullName: "Fallback Owner",
      profile: { bio: "Fallback bio" },
    },
    farm: {
      id: 3,
      title: "Flatbygd gård",
      description: "Kornjord i Østfold",
      municipality: "Råde",
      county: "Østfold",
      address: "Gårdsveien 1",
      centroidLat: 59.35,
      centroidLng: 10.85,
      soilType: "Leirjord",
      soilQuality: "God",
      owner: {
        fullName: "Lars Bakken",
        profile: { bio: "Pensjonert bonde" },
      },
      parcels: [
        {
          areaDekar: 100,
          polygonJson: JSON.stringify([[59.35, 10.85]]),
          soilCompositionJson: JSON.stringify({
            leire: 45,
            sand: 20,
            silt: 28,
            organisk: 7,
          }),
        },
        {
          areaDekar: 42,
          polygonJson: "not-json",
          soilCompositionJson: "not-json",
        },
      ],
      cropTypes: [
        { cropType: { name: "hvete" } },
        { cropType: { name: "bygg" } },
      ],
    },
    bids: [
      {
        id: 91,
        amountPerDekarYear: 710,
        status: "WINNING",
        createdAt: new Date("2026-04-02T00:00:00.000Z"),
        bidder: { fullName: "Sivert Dahl" },
      },
      {
        id: 90,
        amountPerDekarYear: 690,
        status: "OUTBID",
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
        bidder: null,
      },
    ],
    ...overrides,
  };
}

function createDeleteManyTracker() {
  const calls = [];
  const method = async (args) => {
    calls.push(args);
  };

  return { calls, method };
}

test("toView maps Prisma listings into the legacy auction view model", () => {
  const view = toView(buildListing());

  assert.equal(view.id, 10);
  assert.equal(view._id, 10);
  assert.equal(view.farmId, 3);
  assert.equal(view.title, "Flatbygd gård");
  assert.equal(view.ownerName, "Lars Bakken");
  assert.equal(view.ownerDescription, "Pensjonert bonde");
  assert.equal(view.fylke, "Østfold");
  assert.equal(view.sizeDekar, 142);
  assert.equal(view.soilType, "Leirjord");
  assert.equal(view.status, "aktiv");
  assert.deepEqual(view.fieldPolygon, [[59.35, 10.85]]);
  assert.deepEqual(view.soilComposition, {
    leire: 45,
    sand: 20,
    silt: 28,
    organisk: 7,
  });
  assert.deepEqual(view.cropTypes, ["hvete", "bygg"]);
  assert.deepEqual(view.bids.map((bid) => bid.bidderName), ["Sivert Dahl", "Anonym"]);
});

test("toView falls back to defaults when nested listing data is sparse", () => {
  const view = toView(buildListing({
    status: "ENDED",
    farm: {
      title: "Ukjent gård",
      parcels: [{}],
      cropTypes: [],
    },
    owner: {
      fullName: "Reserve Owner",
      profile: {},
    },
    bids: [],
  }));

  assert.equal(view.ownerName, "Reserve Owner");
  assert.equal(view.ownerDescription, null);
  assert.equal(view.lat, 60.472);
  assert.equal(view.lng, 8.469);
  assert.equal(view.soilType, "Leirjord");
  assert.equal(view.soilQuality, "God");
  assert.deepEqual(view.fieldPolygon, []);
  assert.deepEqual(view.soilComposition, {
    leire: 35,
    sand: 25,
    silt: 30,
    organisk: 10,
  });
  assert.equal(view.status, "avsluttet");
});

test("toView tolerates invalid JSON and already-parsed parcel metadata", () => {
  const invalidJsonView = toView(buildListing({
    farm: {
      ...buildListing().farm,
      parcels: [
        {
          areaDekar: 10,
          polygonJson: "not-json",
          soilCompositionJson: "not-json",
        },
      ],
    },
  }));

  assert.deepEqual(invalidJsonView.fieldPolygon, []);
  assert.deepEqual(invalidJsonView.soilComposition, {
    leire: 35,
    sand: 25,
    silt: 30,
    organisk: 10,
  });

  const parsedValueView = toView(buildListing({
    farm: {
      ...buildListing().farm,
      parcels: [
        {
          areaDekar: 10,
          polygonJson: [[1, 2]],
          soilCompositionJson: {
            leire: 20,
            sand: 30,
            silt: 40,
            organisk: 10,
          },
        },
      ],
    },
  }));

  assert.deepEqual(parsedValueView.fieldPolygon, [[1, 2]]);
  assert.deepEqual(parsedValueView.soilComposition, {
    leire: 20,
    sand: 30,
    silt: 40,
    organisk: 10,
  });
});

test("find translates filters into a Prisma query and maps the results", async () => {
  const listing = buildListing({ status: "UPCOMING" });
  const prisma = {
    listing: {
      findMany: async (args) => {
        assert.deepEqual(args.where, {
          farm: { is: { county: "Vestland" } },
          status: "ENDED",
        });
        assert.deepEqual(args.orderBy, { auctionEndAt: "asc" });
        return [listing];
      },
    },
  };

  const model = createFarmModel(prisma);
  const result = await model.find({ fylke: "Vestland", status: "avsluttet" });

  assert.equal(result.length, 1);
  assert.equal(result[0].status, "kommende");
});

test("findById parses ids before delegating to Prisma", async () => {
  const listing = buildListing();
  const prisma = {
    listing: {
      findUnique: async (args) => {
        assert.deepEqual(args.where, { id: 25 });
        return listing;
      },
    },
  };

  const model = createFarmModel(prisma);
  const result = await model.findById("25");
  assert.equal(result.id, 10);
});

test("create rejects invalid auction dates", async () => {
  const model = createFarmModel({
    $transaction: async () => {
      throw new Error("should not be called");
    },
  });

  await assert.rejects(() => model.create({
    title: "Ny gård",
    auctionStart: "invalid",
    auctionEnd: "2026-04-10",
  }), /Auksjonsdatoene er ugyldige/);
});

test("create rejects auctions that end before they start", async () => {
  const model = createFarmModel({
    $transaction: async () => {
      throw new Error("should not be called");
    },
  });

  await assert.rejects(() => model.create({
    title: "Ny gård",
    auctionStart: "2026-04-10",
    auctionEnd: "2026-04-01",
  }), /Auksjonen må slutte etter at den starter/);
});

test("create persists owner, farm, parcel, crop links, and listing defaults", async () => {
  const calls = {
    userUpsert: [],
    verificationUpsert: [],
    farmCreate: [],
    parcelCreate: [],
    cropTypeUpsert: [],
    farmCropTypeUpsert: [],
    listingCreate: [],
  };

  const tx = {
    user: {
      upsert: async (args) => {
        calls.userUpsert.push(args);
        return { id: 11, profile: {} };
      },
    },
    userVerification: {
      upsert: async (args) => {
        calls.verificationUpsert.push(args);
      },
    },
    farm: {
      create: async (args) => {
        calls.farmCreate.push(args);
        return { id: 22 };
      },
    },
    farmParcel: {
      create: async (args) => {
        calls.parcelCreate.push(args);
      },
    },
    cropType: {
      upsert: async (args) => {
        calls.cropTypeUpsert.push(args);
        return { id: calls.cropTypeUpsert.length };
      },
    },
    farmCropType: {
      upsert: async (args) => {
        calls.farmCropTypeUpsert.push(args);
      },
    },
    listing: {
      create: async (args) => {
        calls.listingCreate.push(args);
        return { id: 33 };
      },
    },
  };

  const prisma = {
    $transaction: async (callback) => callback(tx),
    listing: {
      findUnique: async () => buildListing({
        id: 33,
        status: "DRAFT",
        currentBidPerDekarYear: 0,
      }),
    },
  };

  const model = createFarmModel(prisma);
  const result = await model.create({
    title: "Ny gård",
    description: "Beskrivelse",
    ownerName: "  Kari Ødegård  ",
    ownerDescription: "Driver ikke lenger selv",
    municipality: "Stange",
    fylke: "Innlandet",
    address: "",
    lat: "",
    lng: 11.19,
    fieldPolygon: JSON.stringify([[1, 2], [3, 4]]),
    sizeDekar: "240",
    soilType: "",
    soilQuality: "",
    soilComposition: "{\"leire\":40,\"sand\":20,\"silt\":30,\"organisk\":10}",
    auctionStart: "2026-05-01",
    auctionEnd: "2026-05-10",
    startingBid: "540",
    currentBid: "",
    rentalPeriodYears: "",
    status: "utkast",
    cropTypes: ["korn", "korn", "raps", "  "],
  });

  assert.equal(result.id, 33);
  assert.equal(result.status, "kommende");
  assert.equal(calls.userUpsert.length, 1);
  assert.equal(calls.verificationUpsert.length, 1);
  assert.equal(calls.farmCreate[0].data.address, null);
  assert.equal(calls.farmCreate[0].data.centroidLat, 60.472);
  assert.equal(calls.farmCreate[0].data.centroidLng, 11.19);
  assert.equal(calls.farmCreate[0].data.soilType, "Leirjord");
  assert.equal(calls.farmCreate[0].data.soilQuality, "God");
  assert.deepEqual(calls.parcelCreate[0].data.polygonJson, [[1, 2], [3, 4]]);
  assert.deepEqual(calls.parcelCreate[0].data.soilCompositionJson, {
    leire: 40,
    sand: 20,
    silt: 30,
    organisk: 10,
  });
  assert.deepEqual(calls.cropTypeUpsert.map((call) => call.where.slug), ["korn", "raps"]);
  assert.equal(calls.farmCropTypeUpsert.length, 2);
  assert.equal(calls.listingCreate[0].data.status, "DRAFT");
  assert.equal(calls.listingCreate[0].data.rentalPeriodYears, 5);
  assert.equal(calls.listingCreate[0].data.startingBidPerDekarYear, 540);
  assert.equal(calls.listingCreate[0].data.currentBidPerDekarYear, 0);
  assert.ok(calls.listingCreate[0].data.publishedAt instanceof Date);
});

test("create infers UPCOMING and ENDED listing statuses from auction dates", async () => {
  const createdStatuses = [];
  const tx = {
    user: {
      upsert: async () => ({ id: 1, profile: {} }),
    },
    userVerification: {
      upsert: async () => {},
    },
    farm: {
      create: async () => ({ id: 2 }),
    },
    farmParcel: {
      create: async () => {},
    },
    cropType: {
      upsert: async () => ({ id: 1 }),
    },
    farmCropType: {
      upsert: async () => {},
    },
    listing: {
      create: async (args) => {
        createdStatuses.push(args.data.status);
        return { id: createdStatuses.length };
      },
    },
  };

  const listings = [
    buildListing({ id: 1, status: "UPCOMING" }),
    buildListing({ id: 2, status: "ENDED" }),
  ];
  let nextListing = 0;

  const prisma = {
    $transaction: async (callback) => callback(tx),
    listing: {
      findUnique: async () => listings[nextListing++],
    },
  };

  const model = createFarmModel(prisma);

  await model.create({
    title: "Kommende gård",
    description: "Beskrivelse",
    ownerName: "Kari",
    municipality: "Stange",
    fylke: "Innlandet",
    sizeDekar: 10,
    auctionStart: "3026-05-01",
    auctionEnd: "3026-05-10",
    startingBid: 100,
  });

  await model.create({
    title: "Avsluttet gård",
    description: "Beskrivelse",
    ownerName: "Kari",
    municipality: "Stange",
    fylke: "Innlandet",
    sizeDekar: 10,
    auctionStart: "2020-05-01",
    auctionEnd: "2020-05-10",
    startingBid: 100,
  });

  assert.deepEqual(createdStatuses, ["UPCOMING", "ENDED"]);
});

test("create infers ACTIVE when the auction window is currently open", async () => {
  const createdStatuses = [];
  const tx = {
    user: {
      upsert: async () => ({ id: 1, profile: {} }),
    },
    userVerification: {
      upsert: async () => {},
    },
    farm: {
      create: async () => ({ id: 2 }),
    },
    farmParcel: {
      create: async () => {},
    },
    cropType: {
      upsert: async () => ({ id: 1 }),
    },
    farmCropType: {
      upsert: async () => {},
    },
    listing: {
      create: async (args) => {
        createdStatuses.push(args.data.status);
        return { id: 1 };
      },
    },
  };

  const prisma = {
    $transaction: async (callback) => callback(tx),
    listing: {
      findUnique: async () => buildListing({ id: 1, status: "ACTIVE" }),
    },
  };

  const model = createFarmModel(prisma);
  const now = Date.now();

  await model.create({
    title: "Aktiv gård",
    description: "Beskrivelse",
    ownerName: "Kari",
    municipality: "Stange",
    fylke: "Innlandet",
    sizeDekar: 10,
    auctionStart: new Date(now - 60_000),
    auctionEnd: new Date(now + 60_000),
    startingBid: 100,
  });

  assert.deepEqual(createdStatuses, ["ACTIVE"]);
});

test("update persists listing, farm, owner, parcel, and crop changes", async () => {
  const calls = {
    userUpdate: [],
    farmUpdate: [],
    parcelUpdate: [],
    cropDeleteMany: [],
    cropTypeUpsert: [],
    farmCropTypeUpsert: [],
    listingUpdate: [],
  };

  const tx = {
    listing: {
      findUnique: async () => ({
        id: 44,
        farmId: 22,
        ownerUserId: 11,
        currentBidPerDekarYear: 710,
        publishedAt: new Date("2026-04-01T00:00:00.000Z"),
        farm: {
          id: 22,
          centroidLat: 59.35,
          centroidLng: 10.85,
          parcels: [{
            id: 33,
            polygonJson: [[59.35, 10.85]],
            soilCompositionJson: { leire: 35, sand: 25, silt: 30, organisk: 10 },
          }],
        },
      }),
      update: async (args) => {
        calls.listingUpdate.push(args);
      },
    },
    user: {
      update: async (args) => {
        calls.userUpdate.push(args);
        return { id: 11, profile: {} };
      },
    },
    farm: {
      update: async (args) => {
        calls.farmUpdate.push(args);
      },
    },
    farmParcel: {
      update: async (args) => {
        calls.parcelUpdate.push(args);
      },
    },
    farmCropType: {
      deleteMany: async (args) => {
        calls.cropDeleteMany.push(args);
      },
      upsert: async (args) => {
        calls.farmCropTypeUpsert.push(args);
      },
    },
    cropType: {
      upsert: async (args) => {
        calls.cropTypeUpsert.push(args);
        return { id: calls.cropTypeUpsert.length };
      },
    },
  };

  const prisma = {
    $transaction: async (callback) => callback(tx),
    listing: {
      findUnique: async () => buildListing({ id: 44, status: "UPCOMING" }),
    },
  };

  const model = createFarmModel(prisma);
  const result = await model.update("44", {
    title: "Oppdatert gård",
    description: "Ny tekst",
    ownerName: "Kari",
    ownerDescription: "Eier",
    municipality: "Stange",
    fylke: "Innlandet",
    address: "",
    sizeDekar: "120",
    soilType: "",
    soilQuality: "",
    auctionStart: "3026-05-01",
    auctionEnd: "3026-05-10",
    startingBid: "700",
    rentalPeriodYears: "8",
    status: "kommende",
    cropTypes: ["hvete", "bygg"],
  });

  assert.equal(result.id, 44);
  assert.deepEqual(calls.userUpdate[0].where, { id: 11 });
  assert.equal(calls.userUpdate[0].data.fullName, "Kari");
  assert.deepEqual(calls.farmUpdate[0], {
    where: { id: 22 },
    data: {
      ownerUserId: 11,
      title: "Oppdatert gård",
      description: "Ny tekst",
      municipality: "Stange",
      county: "Innlandet",
      address: null,
      centroidLat: 59.35,
      centroidLng: 10.85,
      soilType: "Leirjord",
      soilQuality: "God",
    },
  });
  assert.deepEqual(calls.parcelUpdate[0].where, { id: 33 });
  assert.equal(calls.parcelUpdate[0].data.areaDekar, 120);
  assert.deepEqual(calls.cropDeleteMany, [{ where: { farmId: 22 } }]);
  assert.deepEqual(calls.cropTypeUpsert.map((call) => call.where.slug), ["hvete", "bygg"]);
  assert.equal(calls.listingUpdate[0].data.status, "UPCOMING");
  assert.equal(calls.listingUpdate[0].data.rentalPeriodYears, 8);
  assert.equal(calls.listingUpdate[0].data.startingBidPerDekarYear, 700);
});

test("deleteById deletes the listing and orphaned farm", async () => {
  const calls = [];
  const tx = {
    listing: {
      findUnique: async (args) => {
        calls.push(["findUnique", args]);
        return { farmId: 22 };
      },
      delete: async (args) => {
        calls.push(["listingDelete", args]);
      },
      count: async (args) => {
        calls.push(["listingCount", args]);
        return 0;
      },
    },
    farm: {
      delete: async (args) => {
        calls.push(["farmDelete", args]);
      },
    },
  };

  const model = createFarmModel({
    $transaction: async (callback) => callback(tx),
  });

  await model.deleteById("44");

  assert.deepEqual(calls, [
    ["findUnique", { where: { id: 44 }, select: { farmId: true } }],
    ["listingDelete", { where: { id: 44 } }],
    ["listingCount", { where: { farmId: 22 } }],
    ["farmDelete", { where: { id: 22 } }],
  ]);
});

test("updateBid rejects non-positive bid amounts", async () => {
  const model = createFarmModel({
    $transaction: async () => {
      throw new Error("should not be called");
    },
  });

  await assert.rejects(() => model.updateBid(1, 0), /Budet må være større enn 0/);
});

test("updateBid rejects missing listings", async () => {
  const prisma = {
    $transaction: async (callback) => callback({
      listing: {
        findUnique: async () => null,
      },
    }),
  };

  const model = createFarmModel(prisma);
  await assert.rejects(() => model.updateBid(1, 100), /Auksjonen finnes ikke/);
});

test("updateBid rejects offers below the required minimum", async () => {
  const prisma = {
    $transaction: async (callback) => callback({
      listing: {
        findUnique: async () => ({
          currentBidPerDekarYear: 700,
          startingBidPerDekarYear: 650,
          farm: {
            county: "Østfold",
            parcels: [{ areaDekar: 100 }],
          },
        }),
      },
    }),
  };

  const model = createFarmModel(prisma);
  await assert.rejects(() => model.updateBid(1, 700), /gjeldende minstepris/);
});

test("updateBid marks prior bids as outbid, creates a winning bid, and updates the listing", async () => {
  const calls = {
    userUpsert: [],
    verificationUpsert: [],
    bidUpdateMany: [],
    bidCreate: [],
    listingUpdate: [],
  };

  const tx = {
    listing: {
      findUnique: async () => ({
        id: 44,
        currentBidPerDekarYear: 0,
        startingBidPerDekarYear: 650,
        farm: {
          county: "Østfold",
          parcels: [{ areaDekar: 100 }, { areaDekar: 25 }],
        },
      }),
      update: async (args) => {
        calls.listingUpdate.push(args);
      },
    },
    user: {
      upsert: async (args) => {
        calls.userUpsert.push(args);
        return { id: 55, profile: {} };
      },
    },
    userVerification: {
      upsert: async (args) => {
        calls.verificationUpsert.push(args);
      },
    },
    bid: {
      updateMany: async (args) => {
        calls.bidUpdateMany.push(args);
      },
      create: async (args) => {
        calls.bidCreate.push(args);
      },
    },
  };

  const prisma = {
    $transaction: async (callback) => callback(tx),
    listing: {
      findUnique: async () => buildListing({
        id: 44,
        currentBidPerDekarYear: 700,
        bids: [],
      }),
    },
  };

  const model = createFarmModel(prisma);
  const result = await model.updateBid("44", "810", "  Hedda Vik  ");

  assert.equal(result.id, 44);
  assert.equal(calls.userUpsert.length, 1);
  assert.equal(calls.verificationUpsert.length, 1);
  assert.deepEqual(calls.bidUpdateMany[0], {
    where: {
      listingId: 44,
      status: {
        in: ["VALID", "WINNING"],
      },
    },
    data: {
      status: "OUTBID",
    },
  });
  assert.deepEqual(calls.bidCreate[0], {
    data: {
      listingId: 44,
      bidderUserId: 55,
      amountPerDekarYear: 810,
      totalAmountPerYear: 101250,
      status: "WINNING",
    },
  });
  assert.deepEqual(calls.listingUpdate[0], {
    where: { id: 44 },
    data: { currentBidPerDekarYear: 810 },
  });
});

test("deleteAll clears every related table in dependency order", async () => {
  const trackers = {
    message: createDeleteManyTracker(),
    conversationParticipant: createDeleteManyTracker(),
    conversation: createDeleteManyTracker(),
    lease: createDeleteManyTracker(),
    bid: createDeleteManyTracker(),
    listing: createDeleteManyTracker(),
    farmCropType: createDeleteManyTracker(),
    cropType: createDeleteManyTracker(),
    farmParcel: createDeleteManyTracker(),
    farm: createDeleteManyTracker(),
    userVerification: createDeleteManyTracker(),
    userProfile: createDeleteManyTracker(),
    contactSubmission: createDeleteManyTracker(),
    user: createDeleteManyTracker(),
  };

  const prisma = Object.fromEntries(
    Object.entries(trackers).map(([key, tracker]) => [key, { deleteMany: tracker.method }]),
  );

  const model = createFarmModel(prisma);
  await model.deleteAll();

  for (const tracker of Object.values(trackers)) {
    assert.deepEqual(tracker.calls, [{}]);
  }
});

test("insertMany delegates each farm to create", async () => {
  const model = createFarmModel({});
  const calls = [];
  model.create = async (farm) => {
    calls.push(farm);
  };

  const farms = [{ title: "A" }, { title: "B" }];
  await model.insertMany(farms);

  assert.deepEqual(calls, farms);
});
