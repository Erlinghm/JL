// ============================================================
// Lease model
//
// Håndterer jordleigeavtaler. Hovudfunksjonen er
// createFromListing(listingId) som pre-fyller ein avtale med
// alle kjende felt frå auksjonen når den vert avslutta.
// ============================================================

const defaultPrisma = require("../prisma/client");

const leaseInclude = {
  listing: {
    include: {
      farm: {
        include: {
          owner: { include: { profile: true } },
          parcels: true,
        },
      },
      owner: { include: { profile: true } },
    },
  },
  owner: { include: { profile: true } },
  tenant: { include: { profile: true } },
  winningBid: true,
};

function formatAddress(profile) {
  if (!profile) return null;
  const parts = [
    profile.address,
    [profile.postalCode, profile.postalPlace].filter(Boolean).join(" "),
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function toPartyView(user) {
  if (!user) return null;
  const profile = user.profile || {};
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || null,
    birthDate: profile.birthDate || null,
    address: profile.address || null,
    postalCode: profile.postalCode || null,
    postalPlace: profile.postalPlace || null,
    addressFormatted: formatAddress(profile),
    organizationNumber: profile.organizationNumber || null,
    county: profile.county || null,
  };
}

function sumParcels(parcels = [], key) {
  return parcels.reduce((sum, p) => sum + (Number(p[key]) || 0), 0);
}

function toLeaseView(lease) {
  if (!lease) return null;
  const listing = lease.listing || {};
  const farm = listing.farm || {};
  const parcels = farm.parcels || [];

  return {
    id: lease.id,
    listingId: lease.listingId,
    status: lease.status,
    startDate: lease.startDate,
    endDate: lease.endDate,
    annualAmount: lease.annualAmount,
    contractDataJson: lease.contractDataJson || {},
    ownerSignedAt: lease.ownerSignedAt,
    tenantSignedAt: lease.tenantSignedAt,
    signedAt: lease.signedAt,
    createdAt: lease.createdAt,
    updatedAt: lease.updatedAt,
    owner: toPartyView(lease.owner),
    tenant: toPartyView(lease.tenant),
    // Avtalefelt som er henta frå annonsen / auksjonen
    contract: {
      title: farm.title,
      municipality: farm.municipality,
      county: farm.county,
      address: farm.address,
      rentalPeriodYears: listing.rentalPeriodYears,
      firstLeaseYear: lease.startDate ? new Date(lease.startDate).getFullYear() : null,
      amountPerDekarYear: lease.winningBid?.amountPerDekarYear || null,
      totalAnnualAmount: lease.annualAmount,
      paymentDueDate: listing.paymentDueDate,
      firstDueDate: listing.firstDueDate,
      vatApplies: listing.vatApplies,
      indexRegulation: listing.indexRegulation,
      indexType: listing.indexType,
      indexStartYear: listing.indexStartYear,
      indexBaseYear: listing.indexBaseYear,
      hasConditionReport: listing.hasConditionReport,
      hasFloghavre: listing.hasFloghavre,
      hasSoilSamples: listing.hasSoilSamples,
      hasFertilizerPlan: listing.hasFertilizerPlan,
      conditionNotes: listing.conditionNotes,
      additionalTerms: listing.additionalTerms,
      specialTerms: listing.specialTerms,
      matrikler: parcels
        .filter((p) => p.gnr || p.bnr || p.matrikkelNote)
        .map((p) => ({
          gnr: p.gnr,
          bnr: p.bnr,
          matrikkelNote: p.matrikkelNote,
          kommune: farm.municipality,
        })),
      areas: {
        fulldyrka: sumParcels(parcels, "areaFulldyrkaDekar"),
        overflatedyrka: sumParcels(parcels, "areaOverflatedyrkaDekar"),
        innmarksbeite: sumParcels(parcels, "areaInnmarksbeiteDekar"),
        anna: sumParcels(parcels, "areaAnnaDekar"),
        total: sumParcels(parcels, "areaDekar"),
      },
    },
  };
}

function createLeaseModel(prisma = defaultPrisma) {
  // Statusar der eigaren faktisk kan avslutte auksjonen og opprette ein avtale.
  // - ACTIVE: avslutt tidleg
  // - ENDED:  auksjonen er ute på tid, men enno ikkje tildelt
  const CLOSABLE_LISTING_STATUSES = new Set(["ACTIVE", "ENDED"]);

  /**
   * Opprettar ein Lease frå ein avslutta auksjon.
   * - Finn vinnande Bid (høgste beløp med status WINNING)
   * - Set Listing.winnerBidId og status = AWARDED
   * - Oppretter Lease med alle kjende felt pre-fylt
   *
   * Kastar feil om auksjonen ikkje er klar (feil status, ingen bod,
   * ingen vinnar, eller Lease allereie finst), eller om brukaren som
   * prøver å avslutte ikkje er eigaren av annonsen.
   *
   * @param {number|string} listingId
   * @param {{ userId?: number }} [options]  userId vert brukt for eigarsjekk.
   */
  async function createFromListing(listingId, options = {}) {
    const id = parseInt(listingId, 10);
    if (!Number.isFinite(id)) throw new Error("Ugyldig listing-id.");

    const { userId } = options;

    return prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({
        where: { id },
        include: {
          lease: true,
          farm: { include: { parcels: true } },
          bids: { where: { status: "WINNING" }, orderBy: { amountPerDekarYear: "desc" } },
        },
      });

      if (!listing) throw new Error("Fann ikkje auksjonen.");

      // Eigarsjekk: berre eigaren av annonsen kan avslutte auksjonen.
      // userId er valfri for å halde ryggkompatibilitet med eldre kallarar.
      if (userId !== undefined && userId !== null && listing.ownerUserId !== userId) {
        throw new Error("Berre eigaren av annonsen kan avslutte auksjonen.");
      }

      // Status-guard: blokkér DRAFT/UPCOMING/AWARDED/CANCELLED/PUBLISHED.
      if (!CLOSABLE_LISTING_STATUSES.has(listing.status)) {
        throw new Error(
          `Auksjonen kan ikkje avsluttast når status er ${listing.status}.`
        );
      }

      if (listing.lease) throw new Error("Det finst allereie ein avtale for denne auksjonen.");

      const winningBid = listing.bids[0];
      if (!winningBid) throw new Error("Ingen vinnande bod – kan ikkje opprette avtale.");

      // Bereken start- og sluttdato for leigeperioden.
      // Startdato = dagen etter auksjonen sluttar (kan overstyrast manuelt seinare).
      const startDate = new Date(listing.auctionEndAt);
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + (listing.rentalPeriodYears || 5));

      // Oppdater Listing: merk den som awarded og lagre vinnarbodet
      await tx.listing.update({
        where: { id },
        data: {
          status: "AWARDED",
          winnerBidId: winningBid.id,
        },
      });

      // Rydd opp: alle andre bod som ikkje er WINNING vert OUTBID, vinnaren vert WINNING
      await tx.bid.updateMany({
        where: { listingId: id, id: { not: winningBid.id }, status: { in: ["VALID", "WINNING"] } },
        data: { status: "OUTBID" },
      });

      const lease = await tx.lease.create({
        data: {
          listingId: id,
          ownerUserId: listing.ownerUserId,
          tenantUserId: winningBid.bidderUserId,
          winningBidId: winningBid.id,
          status: "DRAFT",
          startDate,
          endDate,
          annualAmount: winningBid.totalAmountPerYear,
          contractDataJson: {
            // Plass for felt som partane fyller inn i avtalesida
            // (f.eks. "andre forhold", særskilde vilkår om leigetid)
            otherTerms: null,
            specialLeaseTerms: null,
            signingPlace: null,
          },
        },
      });

      return lease.id;
    });
  }

  async function findById(id) {
    const lease = await prisma.lease.findUnique({
      where: { id: parseInt(id, 10) },
      include: leaseInclude,
    });
    return toLeaseView(lease);
  }

  async function findByListingId(listingId) {
    const lease = await prisma.lease.findUnique({
      where: { listingId: parseInt(listingId, 10) },
      include: leaseInclude,
    });
    return toLeaseView(lease);
  }

  async function findForUser(userId) {
    const leases = await prisma.lease.findMany({
      where: {
        OR: [{ ownerUserId: userId }, { tenantUserId: userId }],
      },
      include: leaseInclude,
      orderBy: { createdAt: "desc" },
    });
    return leases.map(toLeaseView);
  }

  async function updateContractData(leaseId, userId, data) {
    const id = parseInt(leaseId, 10);
    const lease = await prisma.lease.findUnique({ where: { id } });
    if (!lease) throw new Error("Fann ikkje avtalen.");
    if (lease.ownerUserId !== userId && lease.tenantUserId !== userId) {
      throw new Error("Du har ikkje tilgang til denne avtalen.");
    }
    if (lease.status !== "DRAFT" && lease.status !== "SENT") {
      throw new Error("Avtalen kan ikkje endrast etter signering.");
    }
    const current = lease.contractDataJson || {};
    const merged = { ...current, ...data };
    await prisma.lease.update({
      where: { id },
      data: { contractDataJson: merged },
    });
    return findById(id);
  }

  const model = { createFromListing, findById, findByListingId, findForUser, updateContractData, toLeaseView };
  return model;
}

const leaseModel = createLeaseModel();

module.exports = leaseModel;
module.exports.createLeaseModel = createLeaseModel;
module.exports.toLeaseView = toLeaseView;
