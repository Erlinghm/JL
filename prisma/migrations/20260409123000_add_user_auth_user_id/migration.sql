ALTER TABLE "User"
ADD COLUMN "auth_user_id" TEXT;

CREATE UNIQUE INDEX "User_auth_user_id_key" ON "User"("auth_user_id");
