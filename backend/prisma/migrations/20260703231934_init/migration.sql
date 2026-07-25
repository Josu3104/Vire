-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('comun', 'member', 'empleador', 'admin');

-- CreateEnum
CREATE TYPE "AvailabilityState" AS ENUM ('available', 'research', 'unavailable');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('publico', 'pendiente', 'requiere_cambios');

-- CreateEnum
CREATE TYPE "BadgeRequestStatus" AS ENUM ('pending', 'approved', 'denied');

-- CreateEnum
CREATE TYPE "AcademicLevelType" AS ENUM ('tecnico_escolar', 'universitario', 'profesional');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('empleo', 'pasantia', 'evento');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "password_hash" VARCHAR NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'comun',
    "affiliation" VARCHAR,
    "pending_verification" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" VARCHAR,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "bio" TEXT,
    "birthdate" DATE,
    "phone" VARCHAR,
    "university" VARCHAR NOT NULL DEFAULT 'Sin especificar',
    "campus" VARCHAR,
    "city" VARCHAR,
    "academic_status" VARCHAR,
    "availability_state" "AvailabilityState" NOT NULL DEFAULT 'unavailable',
    "is_contact_public" BOOLEAN NOT NULL DEFAULT true,
    "banner_url" VARCHAR,
    "cv_url" VARCHAR,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR NOT NULL,
    "university" VARCHAR NOT NULL,
    "branch" VARCHAR NOT NULL,
    "cover_image_url" VARCHAR,
    "pdf_link" VARCHAR,
    "cad_link" VARCHAR,
    "video_url" VARCHAR,
    "description" TEXT,
    "tags" JSONB DEFAULT '[]',
    "academic_level" "AcademicLevelType" NOT NULL DEFAULT 'universitario',
    "status" "ProjectStatus" NOT NULL DEFAULT 'pendiente',
    "admin_reviewer_id" INTEGER,
    "rejection_reason" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "advisors" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_authors" (
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "project_authors_pkey" PRIMARY KEY ("project_id","user_id")
);

-- CreateTable
CREATE TABLE "project_votes" (
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_upvote" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_votes_pkey" PRIMARY KEY ("project_id","user_id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_hidden_by_author" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "papers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR NOT NULL,
    "abstract" TEXT,
    "doi" VARCHAR,
    "year" INTEGER,
    "journal" VARCHAR,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "tags" JSONB DEFAULT '[]',
    "pdf_link" VARCHAR,

    CONSTRAINT "papers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_coauthors" (
    "paper_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "paper_coauthors_pkey" PRIMARY KEY ("paper_id","user_id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR NOT NULL,
    "icon" VARCHAR NOT NULL,
    "issued_by" VARCHAR NOT NULL,
    "date" DATE NOT NULL,
    "certified" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_requests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "badge_name" VARCHAR NOT NULL,
    "badge_icon" VARCHAR NOT NULL,
    "competition" VARCHAR NOT NULL,
    "evidence_url" VARCHAR NOT NULL,
    "submitted_at" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "BadgeRequestStatus" NOT NULL DEFAULT 'pending',
    "admin_reviewer_id" INTEGER,
    "rejection_reason" TEXT,

    CONSTRAINT "badge_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" SERIAL NOT NULL,
    "participant1_id" INTEGER NOT NULL,
    "participant2_id" INTEGER NOT NULL,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "text" TEXT,
    "attachment_url" VARCHAR,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" VARCHAR NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "related_entity_id" INTEGER,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_listings" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR NOT NULL,
    "company" VARCHAR NOT NULL,
    "type" "JobType" NOT NULL DEFAULT 'empleo',
    "location" VARCHAR NOT NULL,
    "posted_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_university_idx" ON "projects"("university");

-- CreateIndex
CREATE INDEX "projects_branch_idx" ON "projects"("branch");

-- CreateIndex
CREATE UNIQUE INDEX "chats_participant1_id_participant2_id_key" ON "chats"("participant1_id", "participant2_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "job_listings_type_idx" ON "job_listings"("type");

-- CreateIndex
CREATE INDEX "job_listings_location_idx" ON "job_listings"("location");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_admin_reviewer_id_fkey" FOREIGN KEY ("admin_reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_authors" ADD CONSTRAINT "project_authors_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_authors" ADD CONSTRAINT "project_authors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_votes" ADD CONSTRAINT "project_votes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_votes" ADD CONSTRAINT "project_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "papers" ADD CONSTRAINT "papers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_coauthors" ADD CONSTRAINT "paper_coauthors_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_coauthors" ADD CONSTRAINT "paper_coauthors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_requests" ADD CONSTRAINT "badge_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_requests" ADD CONSTRAINT "badge_requests_admin_reviewer_id_fkey" FOREIGN KEY ("admin_reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_participant1_id_fkey" FOREIGN KEY ("participant1_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_participant2_id_fkey" FOREIGN KEY ("participant2_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_listings" ADD CONSTRAINT "job_listings_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
