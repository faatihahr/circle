-- CreateTable
CREATE TABLE "Comments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "thread_id" INTEGER NOT NULL,
    "image" TEXT,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER NOT NULL,

    CONSTRAINT "Comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "Threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
