-- CreateTable
CREATE TABLE "Likes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "thread_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER NOT NULL,

    CONSTRAINT "Likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Likes_user_id_thread_id_key" ON "Likes"("user_id", "thread_id");

-- AddForeignKey
ALTER TABLE "Likes" ADD CONSTRAINT "Likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Likes" ADD CONSTRAINT "Likes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Likes" ADD CONSTRAINT "Likes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Likes" ADD CONSTRAINT "Likes_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "Threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
