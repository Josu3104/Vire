/*
  Warnings:

  - You are about to drop the column `content` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `related_entity_id` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `cad_link` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `cover_image_url` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `pdf_link` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `video_url` on the `projects` table. All the data in the column will be lost.
  - Added the required column `message` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('pending', 'clean', 'infected', 'unscanned');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('COVER', 'IMAGE', 'PDF', 'CAD', 'ZIP', 'VIDEO', 'DOCUMENT', 'OTHER');

-- DropIndex
DROP INDEX "notifications_user_id_is_read_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "content",
DROP COLUMN "related_entity_id",
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "target_url" VARCHAR;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "onboarding_complete" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "cad_link",
DROP COLUMN "cover_image_url",
DROP COLUMN "pdf_link",
DROP COLUMN "video_url",
ADD COLUMN     "abstract" TEXT,
ADD COLUMN     "coauthors" TEXT,
ADD COLUMN     "doi" VARCHAR,
ADD COLUMN     "journal" VARCHAR,
ADD COLUMN     "scan_status" "ScanStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "type" VARCHAR NOT NULL DEFAULT 'project',
ADD COLUMN     "year" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_online" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_seen" TIMESTAMP;

-- CreateTable
CREATE TABLE "project_files" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "filename" VARCHAR NOT NULL,
    "original_name" VARCHAR NOT NULL,
    "mime_type" VARCHAR NOT NULL,
    "extension" VARCHAR NOT NULL,
    "size" INTEGER NOT NULL,
    "storage_provider" VARCHAR NOT NULL,
    "storage_key" VARCHAR NOT NULL,
    "download_url" VARCHAR,
    "type" "FileType" NOT NULL DEFAULT 'OTHER',
    "scan_status" "ScanStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- AddForeignKey
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
