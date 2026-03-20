// ============================================================
// Seed Script – Populates the database with sample farm listings
// Run with: node seed.js   (or: npm run seed)
//
// Requires DATABASE_URL to be set in .env and the schema to be
// migrated first:  npx prisma migrate dev --name init
// ============================================================

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const sampleFarms = [
  {
    title: "Flatbygd gård – Østfold korn",
    description:
      "Flott kornbruk på Østfoldsletta med godt drenert jord og moderne adkomstvei. Arealet er pløyd og klart for ny leietaker. Har vært drevet med hvete og bygg i 20 år med gode avlinger.",
    ownerName: "Lars Bakken",
    ownerDescription:
      "Jeg er pensjonert bonde fra Råde og ønsker at jorda mi skal bli godt ivaretatt. Selger ikke – kun utleie til seriøse aktører.",
    municipality: "Råde",
    fylke: "Østfold",
    address: "Flatbygdveien 14, 1640 Råde",
    lat: 59.35,
    lng: 10.85,
    fieldPolygon: [
      [59.352, 10.848],
      [59.355, 10.855],
      [59.351, 10.860],
      [59.348, 10.853]
    ],
    sizeDekar: 142,
    soilType: "Leirjord",
    soilQuality: "God",
    soilComposition: { leire: 45, sand: 20, silt: 28, organisk: 7 },
    auctionStart: new Date("2026-03-20"),
    auctionEnd:   new Date("2026-04-10"),
    startingBid:  650,
    currentBid:   720,
    rentalPeriodYears: 5,
    status: "aktiv",
    cropTypes: ["korn", "hvete", "bygg"]
  },
  {
    title: "Vestlandsgård – Hordaland grønsaker",
    description:
      "Variert areal i Hardangerfjordregionen med godt klima for grønnsaker og bær. Arealet inkluderer drivhus og lager. Unik mulighet for gartneri eller spesialproduksjon.",
    ownerName: "Ingrid Haugen",
    ownerDescription:
      "Familieeiendom i tre generasjoner. Ønsker en leietaker som kan videreføre den gode driften vi har hatt.",
    municipality: "Kvam",
    fylke: "Vestland",
    address: "Øystesevegen 88, 5600 Norheimsund",
    lat: 60.37,
    lng: 6.15,
    fieldPolygon: [
      [60.372, 6.148],
      [60.375, 6.155],
      [60.371, 6.161],
      [60.368, 6.154]
    ],
    sizeDekar: 68,
    soilType: "Sandjord",
    soilQuality: "Middels",
    soilComposition: { leire: 15, sand: 50, silt: 25, organisk: 10 },
    auctionStart: new Date("2026-03-15"),
    auctionEnd:   new Date("2026-04-05"),
    startingBid:  480,
    currentBid:   510,
    rentalPeriodYears: 3,
    status: "aktiv",
    cropTypes: ["grønnsaker", "bær", "frukt"]
  },
  {
    title: "Trøndelag kornland – stort areal",
    description:
      "Et av de fineste kornarealene i Trøndelag. Sammenhengende og lettkjørt, med godt drenert leirjord. Ideelt for storskala kornproduksjon eller potet.",
    ownerName: "Ole Morten Svendsen",
    ownerDescription:
      "Driver annen virksomhet og ønsker å leie ut jorda til noen som vil bruke den aktivt.",
    municipality: "Verdal",
    fylke: "Trøndelag",
    address: "Storveien 7, 7651 Verdal",
    lat: 63.79,
    lng: 11.49,
    fieldPolygon: [
      [63.792, 11.488],
      [63.796, 11.496],
      [63.791, 11.502],
      [63.787, 11.495]
    ],
    sizeDekar: 310,
    soilType: "Leirjord",
    soilQuality: "God",
    soilComposition: { leire: 50, sand: 18, silt: 26, organisk: 6 },
    auctionStart: new Date("2026-04-01"),
    auctionEnd:   new Date("2026-04-25"),
    startingBid:  580,
    currentBid:   0,
    rentalPeriodYears: 7,
    status: "kommende",
    cropTypes: ["korn", "potet"]
  },
  {
    title: "Jæren – Rogaland fulldyrka mark",
    description:
      "Typisk jærsk flatmark med god jordkvalitet. Nærhet til moderne lager og kornmottak. Arealet er regulert for landbruk og har all nødvendig infrastruktur på plass.",
    ownerName: "Ragnhild Foss",
    ownerDescription:
      "Vi er en stor gård som ønsker å leie ut noe av arealet vi ikke rekker å drive selv i år.",
    municipality: "Time",
    fylke: "Rogaland",
    address: "Brynaveien 3, 4346 Bryne",
    lat: 58.73,
    lng: 5.65,
    fieldPolygon: [
      [58.732, 5.648],
      [58.736, 5.655],
      [58.731, 5.661],
      [58.727, 5.654]
    ],
    sizeDekar: 185,
    soilType: "Leirjord",
    soilQuality: "God",
    soilComposition: { leire: 40, sand: 22, silt: 32, organisk: 6 },
    auctionStart: new Date("2026-03-18"),
    auctionEnd:   new Date("2026-04-08"),
    startingBid:  710,
    currentBid:   760,
    rentalPeriodYears: 5,
    status: "aktiv",
    cropTypes: ["korn", "gras", "grønnsaker"]
  },
  {
    title: "Innlandet – potet og grønsak",
    description:
      "Godt egnet areal for potetproduksjon med lett og veldrenert jord. God vanntilgang fra bekk. Kjølekapasitet tilgjengelig på nabogård.",
    ownerName: "Bjørn Kristiansen",
    ownerDescription:
      "Pensjonert bonde med stor eiendom. Ønsker aktiv drift på arealene.",
    municipality: "Gjøvik",
    fylke: "Innlandet",
    address: "Torvmyrveien 12, 2820 Nordre Toten",
    lat: 60.78,
    lng: 10.69,
    fieldPolygon: [
      [60.782, 10.688],
      [60.786, 10.695],
      [60.781, 10.701],
      [60.777, 10.694]
    ],
    sizeDekar: 95,
    soilType: "Sandjord",
    soilQuality: "God",
    soilComposition: { leire: 10, sand: 60, silt: 20, organisk: 10 },
    auctionStart: new Date("2026-03-25"),
    auctionEnd:   new Date("2026-04-15"),
    startingBid:  430,
    currentBid:   450,
    rentalPeriodYears: 4,
    status: "aktiv",
    cropTypes: ["potet", "grønnsaker"]
  },
  {
    title: "Hedmark – stort skogfritt kornbruk",
    description:
      "Sammenhengende kornbruk på Hedmarkssletta. Fri for steinrøyser og lett å maskinere. Leietaker overtar maskiner til gunstig pris.",
    ownerName: "Kari og Petter Holm",
    ownerDescription:
      "Vi driver fortsatt noe selv, men ønsker å leie ut halvparten av arealet fra neste sesong.",
    municipality: "Stange",
    fylke: "Innlandet",
    address: "Romedal, 2335 Stange",
    lat: 60.72,
    lng: 11.19,
    fieldPolygon: [
      [60.722, 11.188],
      [60.727, 11.196],
      [60.721, 11.203],
      [60.716, 11.195]
    ],
    sizeDekar: 240,
    soilType: "Mellomleirjord",
    soilQuality: "Varierende",
    soilComposition: { leire: 35, sand: 30, silt: 28, organisk: 7 },
    auctionStart: new Date("2026-04-05"),
    auctionEnd:   new Date("2026-05-01"),
    startingBid:  540,
    currentBid:   0,
    rentalPeriodYears: 6,
    status: "kommende",
    cropTypes: ["korn", "raps"]
  }
];

async function seed() {
  try {
    console.log("🔗 Connecting to PostgreSQL...");

    // Wipe existing data
    await prisma.bid.deleteMany({});
    await prisma.farmCropType.deleteMany({});
    await prisma.farm.deleteMany({});
    console.log("🗑️  Deleted old data");

    // Insert all sample farms
    for (const farmData of sampleFarms) {
      const { cropTypes, ...farmInput } = farmData;
      
      // Convert dates and JSON fields
      const farm = await prisma.farm.create({
        data: {
          ...farmInput,
          fieldPolygon: JSON.stringify(farmInput.fieldPolygon),
          soilComposition: JSON.stringify(farmInput.soilComposition),
        },
      });

      // Add crop types
      for (const cropType of cropTypes) {
        await prisma.farmCropType.create({
          data: {
            farmId: farm.id,
            cropType,
          },
        });
      }
    }

    console.log(`🌱 Added ${sampleFarms.length} farms`);
    console.log("✅ Done! Start the server with: npm run dev");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
