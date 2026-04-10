ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own user row" ON "User";
CREATE POLICY "Users can view own user row"
ON "User"
FOR SELECT
USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can update own user row" ON "User";
CREATE POLICY "Users can update own user row"
ON "User"
FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can view own profile row" ON "UserProfile";
CREATE POLICY "Users can view own profile row"
ON "UserProfile"
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM "User" u
    WHERE u.id = "UserProfile"."userId"
      AND u.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own profile row" ON "UserProfile";
CREATE POLICY "Users can update own profile row"
ON "UserProfile"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM "User" u
    WHERE u.id = "UserProfile"."userId"
      AND u.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "User" u
    WHERE u.id = "UserProfile"."userId"
      AND u.auth_user_id = auth.uid()
  )
);
