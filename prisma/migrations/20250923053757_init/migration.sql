/*
  Warnings:

  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."products";

-- CreateTable
CREATE TABLE "public"."MainCategory" (
    "mcId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MainCategory_pkey" PRIMARY KEY ("mcId")
);

-- CreateTable
CREATE TABLE "public"."SubCategory" (
    "scId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mainCategoryId" TEXT NOT NULL,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("scId")
);

-- AddForeignKey
ALTER TABLE "public"."SubCategory" ADD CONSTRAINT "SubCategory_mainCategoryId_fkey" FOREIGN KEY ("mainCategoryId") REFERENCES "public"."MainCategory"("mcId") ON DELETE RESTRICT ON UPDATE CASCADE;
