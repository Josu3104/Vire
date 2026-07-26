-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('COVER', 'IMAGE', 'PDF', 'CAD', 'ZIP', 'VIDEO', 'DOCUMENT', 'OTHER');

-- DropIndex
DROP INDEX "notifications_user_id_is_read_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "content",
DROP COLUMN "related_entity_id",
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "target_url" VARCHAR;

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

-- AddForeignKey
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate data for cover_image_url
INSERT INTO "project_files" ("project_id", "filename", "original_name", "mime_type", "extension", "size", "storage_provider", "storage_key", "download_url", "type", "scan_status")
SELECT "id", 'cover.jpg', 'cover.jpg', 'image/jpeg', 'jpg', 1024, 'minio', "cover_image_url", "cover_image_url", 'COVER', 'clean'
FROM "projects" WHERE "cover_image_url" IS NOT NULL;

-- Migrate data for pdf_link
INSERT INTO "project_files" ("project_id", "filename", "original_name", "mime_type", "extension", "size", "storage_provider", "storage_key", "download_url", "type", "scan_status")
SELECT "id", 'document.pdf', 'document.pdf', 'application/pdf', 'pdf', 1024, 'minio', "pdf_link", "pdf_link", 'PDF', 'clean'
FROM "projects" WHERE "pdf_link" IS NOT NULL;

-- Migrate data for cad_link
INSERT INTO "project_files" ("project_id", "filename", "original_name", "mime_type", "extension", "size", "storage_provider", "storage_key", "download_url", "type", "scan_status")
SELECT "id", 'model.step', 'model.step', 'application/octet-stream', 'step', 1024, 'minio', "cad_link", "cad_link", 'CAD', 'clean'
FROM "projects" WHERE "cad_link" IS NOT NULL;

-- Migrate data for video_url
INSERT INTO "project_files" ("project_id", "filename", "original_name", "mime_type", "extension", "size", "storage_provider", "storage_key", "download_url", "type", "scan_status")
SELECT "id", 'video.mp4', 'video.mp4', 'video/mp4', 'mp4', 1024, 'minio', "video_url", "video_url", 'VIDEO', 'clean'
FROM "projects" WHERE "video_url" IS NOT NULL;

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "cad_link",
DROP COLUMN "cover_image_url",
DROP COLUMN "pdf_link",
DROP COLUMN "video_url";

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");



