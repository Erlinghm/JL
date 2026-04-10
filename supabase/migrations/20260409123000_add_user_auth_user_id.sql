ALTER TABLE "User"
ADD COLUMN "auth_user_id" UUID;

ALTER TABLE "User"
ADD CONSTRAINT "User_auth_user_id_fkey"
FOREIGN KEY ("auth_user_id") REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "User_auth_user_id_key" ON "User"("auth_user_id");
