-- Utvidar datamodellen med felt som trengst for å auto-fylle jordleigeavtalen (NLR-19)
-- når ein auksjon vert avslutta med ein vinnar.

-- ---- UserProfile: adresse + fødselsdato ----
ALTER TABLE "UserProfile"
  ADD COLUMN IF NOT EXISTS "birthDate"    DATE,
  ADD COLUMN IF NOT EXISTS "address"      TEXT,
  ADD COLUMN IF NOT EXISTS "postalCode"   TEXT,
  ADD COLUMN IF NOT EXISTS "postalPlace"  TEXT;

-- ---- FarmParcel: matrikkel + arealfordeling ----
ALTER TABLE "FarmParcel"
  ADD COLUMN IF NOT EXISTS "gnr"                     INTEGER,
  ADD COLUMN IF NOT EXISTS "bnr"                     INTEGER,
  ADD COLUMN IF NOT EXISTS "matrikkelNote"           TEXT,
  ADD COLUMN IF NOT EXISTS "areaFulldyrkaDekar"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "areaOverflatedyrkaDekar" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "areaInnmarksbeiteDekar"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "areaAnnaDekar"           DOUBLE PRECISION NOT NULL DEFAULT 0;

-- ---- Listing: kontraktsvariablar ----
ALTER TABLE "Listing"
  ADD COLUMN IF NOT EXISTS "paymentDueDate"     TEXT,
  ADD COLUMN IF NOT EXISTS "firstDueDate"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "vatApplies"         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "indexRegulation"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "indexType"          TEXT,
  ADD COLUMN IF NOT EXISTS "indexStartYear"     INTEGER,
  ADD COLUMN IF NOT EXISTS "indexBaseYear"      INTEGER,
  ADD COLUMN IF NOT EXISTS "hasConditionReport" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasFloghavre"       BOOLEAN,
  ADD COLUMN IF NOT EXISTS "hasSoilSamples"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasFertilizerPlan"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "conditionNotes"     TEXT,
  ADD COLUMN IF NOT EXISTS "additionalTerms"    TEXT,
  ADD COLUMN IF NOT EXISTS "specialTerms"       TEXT;

-- ---- Lease: kontraktsdata + delte signaturar ----
ALTER TABLE "Lease"
  ADD COLUMN IF NOT EXISTS "contractDataJson" JSONB,
  ADD COLUMN IF NOT EXISTS "ownerSignedAt"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "tenantSignedAt"   TIMESTAMP(3);
