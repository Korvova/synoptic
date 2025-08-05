/*
  Warnings:

  - A unique constraint covering the columns `[presetId]` on the table `Element` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Element" ADD COLUMN     "presetId" INTEGER;

-- CreateTable
CREATE TABLE "Camera" (
    "id" SERIAL NOT NULL,
    "identifier" TEXT NOT NULL,

    CONSTRAINT "Camera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preset" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "description" TEXT,
    "cameraId" INTEGER NOT NULL,

    CONSTRAINT "Preset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Camera_identifier_key" ON "Camera"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "Preset_cameraId_number_key" ON "Preset"("cameraId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Element_presetId_key" ON "Element"("presetId");

-- AddForeignKey
ALTER TABLE "Element" ADD CONSTRAINT "Element_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "Preset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preset" ADD CONSTRAINT "Preset_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
