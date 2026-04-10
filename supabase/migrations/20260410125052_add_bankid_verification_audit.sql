ALTER TABLE "UserVerification"
ADD COLUMN "provider" TEXT,
ADD COLUMN "provider_subject" TEXT,
ADD COLUMN "acr" TEXT,
ADD COLUMN "verified_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "UserVerification_provider_provider_subject_key"
ON "UserVerification"("provider", "provider_subject");

DROP POLICY IF EXISTS "Users can view own verification rows" ON "UserVerification";
CREATE POLICY "Users can view own verification rows"
ON "UserVerification"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "User" u
    WHERE u.id = "UserVerification"."userId"
      AND u.auth_user_id = (SELECT auth.uid())
  )
);

CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'session_pkey'
      AND conrelid = 'public.session'::regclass
  ) THEN
    ALTER TABLE "session"
    ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "session" FROM anon, authenticated;
