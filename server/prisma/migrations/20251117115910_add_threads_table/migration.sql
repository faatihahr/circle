-- CreateTable
CREATE TABLE "Threads" (
    "id" SERIAL NOT NULL,
    "image" TEXT,
    "number_of_replies" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER NOT NULL,

    CONSTRAINT "Threads_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Threads" ADD CONSTRAINT "Threads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Threads" ADD CONSTRAINT "Threads_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
