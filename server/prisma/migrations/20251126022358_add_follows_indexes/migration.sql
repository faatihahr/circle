-- CreateIndex
CREATE INDEX "Following_follower_id_idx" ON "Following"("follower_id");

-- CreateIndex
CREATE INDEX "Following_following_id_idx" ON "Following"("following_id");
