/*
  Warnings:

  - Added the required column `ogPrice` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resellerPrice` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inGameUsername` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "ogPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "resellerPrice" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "inGameUsername" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "ogPrice" DOUBLE PRECISION,
ADD COLUMN     "resellerPrice" DOUBLE PRECISION;
