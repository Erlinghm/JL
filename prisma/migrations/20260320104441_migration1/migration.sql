-- CreateTable
CREATE TABLE "Farm" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerDescription" TEXT,
    "municipality" TEXT NOT NULL,
    "fylke" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION NOT NULL DEFAULT 60.472,
    "lng" DOUBLE PRECISION NOT NULL DEFAULT 8.469,
    "fieldPolygon" TEXT NOT NULL DEFAULT '[]',
    "sizeDekar" DOUBLE PRECISION NOT NULL,
    "soilType" TEXT NOT NULL DEFAULT 'Leirjord',
    "soilQuality" TEXT NOT NULL DEFAULT 'God',
    "soilComposition" TEXT NOT NULL DEFAULT '{"leire":35,"sand":25,"silt":30,"organisk":10}',
    "auctionStart" TIMESTAMP(3) NOT NULL,
    "auctionEnd" TIMESTAMP(3) NOT NULL,
    "startingBid" DOUBLE PRECISION NOT NULL,
    "currentBid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rentalPeriodYears" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'aktiv',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmCropType" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "cropType" TEXT NOT NULL,

    CONSTRAINT "FarmCropType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "bidderName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FarmCropType_farmId_idx" ON "FarmCropType"("farmId");

-- CreateIndex
CREATE INDEX "Bid_farmId_idx" ON "Bid"("farmId");

-- AddForeignKey
ALTER TABLE "FarmCropType" ADD CONSTRAINT "FarmCropType_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
