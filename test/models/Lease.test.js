const test = require("node:test");
const assert = require("node:assert/strict");

const { createLeaseModel } = require("../../models/Lease");

// Build a minimal fake tx that returns the provided listing and records calls.
function buildPrismaMock({ listing, leaseCreated = { id: 999 } } = {}) {
  const calls = {
    listingFindUnique: [],
    listingUpdate: [],
    bidUpdateMany: [],
    leaseCreate: [],
  };
  const tx = {
    listing: {
      findUnique: async (args) => {
        calls.listingFindUnique.push(args);
        return listing;
      },
      update: async (args) => {
        calls.listingUpdate.push(args);
      },
    },
    bid: {
      updateMany: async (args) => {
        calls.bidUpdateMany.push(args);
      },
    },
    lease: {
      create: async (args) => {
        calls.leaseCreate.push(args);
        return leaseCreated;
      },
    },
  };
  const prisma = {
    $transaction: async (cb) => cb(tx),
  };
  return { prisma, calls };
}

function baseListing(overrides = {}) {
  return {
    id: 7,
    status: "ACTIVE",
    ownerUserId: 42,
    rentalPeriodYears: 5,
    auctionEndAt: new Date("2026-05-01T00:00:00Z"),
    lease: null,
    farm: { parcels: [] },
    bids: [
      {
        id: 101,
        bidderUserId: 77,
        amountPerDekarYear: 800,
        totalAmountPerYear: 80000,
        status: "WINNING",
      },
    ],
    ...overrides,
  };
}

test("createFromListing rejects callers who are not the listing owner", async () => {
  const { prisma } = buildPrismaMock({ listing: baseListing() });
  const model = createLeaseModel(prisma);

  await assert.rejects(
    () => model.createFromListing(7, { userId: 999 }),
    /Berre eigaren av annonsen kan avslutte auksjonen/
  );
});

test("createFromListing allows the listing owner to close the auction", async () => {
  const { prisma, calls } = buildPrismaMock({ listing: baseListing() });
  const model = createLeaseModel(prisma);

  const leaseId = await model.createFromListing(7, { userId: 42 });
  assert.equal(leaseId, 999);
  assert.equal(calls.leaseCreate.length, 1);
  assert.equal(calls.leaseCreate[0].data.ownerUserId, 42);
  assert.equal(calls.leaseCreate[0].data.tenantUserId, 77);
  assert.equal(calls.leaseCreate[0].data.winningBidId, 101);
});

test("createFromListing is backward compatible when no userId is supplied", async () => {
  const { prisma } = buildPrismaMock({ listing: baseListing() });
  const model = createLeaseModel(prisma);

  const leaseId = await model.createFromListing(7);
  assert.equal(leaseId, 999);
});

test("createFromListing blocks DRAFT listings", async () => {
  const { prisma } = buildPrismaMock({ listing: baseListing({ status: "DRAFT" }) });
  const model = createLeaseModel(prisma);

  await assert.rejects(
    () => model.createFromListing(7, { userId: 42 }),
    /kan ikkje avsluttast når status er DRAFT/
  );
});

test("createFromListing blocks UPCOMING listings", async () => {
  const { prisma } = buildPrismaMock({ listing: baseListing({ status: "UPCOMING" }) });
  const model = createLeaseModel(prisma);

  await assert.rejects(
    () => model.createFromListing(7, { userId: 42 }),
    /kan ikkje avsluttast når status er UPCOMING/
  );
});

test("createFromListing blocks already-AWARDED listings", async () => {
  const { prisma } = buildPrismaMock({ listing: baseListing({ status: "AWARDED" }) });
  const model = createLeaseModel(prisma);

  await assert.rejects(
    () => model.createFromListing(7, { userId: 42 }),
    /kan ikkje avsluttast når status er AWARDED/
  );
});

test("createFromListing allows ENDED listings (auction closed by time)", async () => {
  const { prisma, calls } = buildPrismaMock({ listing: baseListing({ status: "ENDED" }) });
  const model = createLeaseModel(prisma);

  const leaseId = await model.createFromListing(7, { userId: 42 });
  assert.equal(leaseId, 999);
  assert.equal(calls.leaseCreate.length, 1);
});

test("createFromListing rejects listings that already have a lease", async () => {
  const { prisma } = buildPrismaMock({
    listing: baseListing({ lease: { id: 1 } }),
  });
  const model = createLeaseModel(prisma);

  await assert.rejects(
    () => model.createFromListing(7, { userId: 42 }),
    /Det finst allereie ein avtale/
  );
});

test("createFromListing rejects listings without a winning bid", async () => {
  const { prisma } = buildPrismaMock({ listing: baseListing({ bids: [] }) });
  const model = createLeaseModel(prisma);

  await assert.rejects(
    () => model.createFromListing(7, { userId: 42 }),
    /Ingen vinnande bod/
  );
});

test("createFromListing rejects ugyldig listing-id", async () => {
  const { prisma } = buildPrismaMock({ listing: baseListing() });
  const model = createLeaseModel(prisma);

  await assert.rejects(
    () => model.createFromListing("not-a-number", { userId: 42 }),
    /Ugyldig listing-id/
  );
});
