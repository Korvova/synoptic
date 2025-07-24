/*
  Warnings:

  - You are about to drop the column `imgOff` on the `Element` table. All the data in the column will be lost.
  - You are about to drop the column `imgOn` on the `Element` table. All the data in the column will be lost.
  - You are about to drop the column `imgWithId` on the `Element` table. All the data in the column will be lost.
  - You are about to drop the column `imgWithoutId` on the `Element` table. All the data in the column will be lost.
  - You are about to alter the column `x` on the `Element` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `y` on the `Element` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `imgWithoutId` on the `ElementType` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Element" DROP COLUMN "imgOff",
DROP COLUMN "imgOn",
DROP COLUMN "imgWithId",
DROP COLUMN "imgWithoutId",
ALTER COLUMN "x" SET DATA TYPE INTEGER,
ALTER COLUMN "y" SET DATA TYPE INTEGER,
ALTER COLUMN "state" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ElementType" DROP COLUMN "imgWithoutId",
ADD COLUMN     "imgNoId" TEXT;
