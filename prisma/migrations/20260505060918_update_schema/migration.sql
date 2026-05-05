/*
  Warnings:

  - You are about to drop the column `change_percent` on the `CryptoAlert` table. All the data in the column will be lost.
  - You are about to drop the column `current_price` on the `CryptoAlert` table. All the data in the column will be lost.
  - You are about to drop the column `previous_price` on the `CryptoAlert` table. All the data in the column will be lost.
  - Added the required column `drop_percentage` to the `CryptoAlert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_at_drop` to the `CryptoAlert` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CryptoAlert" DROP COLUMN "change_percent",
DROP COLUMN "current_price",
DROP COLUMN "previous_price",
ADD COLUMN     "drop_percentage" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "price_at_drop" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT,
ALTER COLUMN "name" DROP NOT NULL;
