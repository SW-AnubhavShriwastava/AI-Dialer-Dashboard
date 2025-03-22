-- CreateEnum
CREATE TYPE "dashboard"."UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "dashboard"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "dashboard"."CampaignStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "dashboard"."ContactStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "dashboard"."AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "dashboard"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "dashboard"."UserRole" NOT NULL DEFAULT 'ADMIN',
    "status" "dashboard"."UserStatus" NOT NULL DEFAULT 'PENDING',
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard"."admin_settings" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "plan_type" TEXT NOT NULL,
    "available_credits" INTEGER NOT NULL DEFAULT 0,
    "assigned_number" TEXT,
    "features" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard"."employees" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard"."campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "status" "dashboard"."CampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard"."campaign_employees" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard"."contacts" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard"."campaign_contacts" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "status" "dashboard"."ContactStatus" NOT NULL DEFAULT 'ACTIVE',
    "call_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_called" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard"."call_logs" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "call_sid" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "duration" INTEGER,
    "recording_url" TEXT,
    "transcript_id" TEXT,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard"."appointments" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "call_log_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "appointment_time" TIMESTAMP(3) NOT NULL,
    "status" "dashboard"."AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard"."employee_access" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "dashboard"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "dashboard"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admin_settings_admin_id_key" ON "dashboard"."admin_settings"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_employees_campaign_id_employee_id_key" ON "dashboard"."campaign_employees"("campaign_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_contacts_campaign_id_contact_id_key" ON "dashboard"."campaign_contacts"("campaign_id", "contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "call_logs_call_sid_key" ON "dashboard"."call_logs"("call_sid");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_call_log_id_key" ON "dashboard"."appointments"("call_log_id");

-- AddForeignKey
ALTER TABLE "dashboard"."admin_settings" ADD CONSTRAINT "admin_settings_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "dashboard"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard"."employees" ADD CONSTRAINT "employees_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "dashboard"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard"."campaigns" ADD CONSTRAINT "campaigns_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "dashboard"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard"."campaign_employees" ADD CONSTRAINT "campaign_employees_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "dashboard"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard"."campaign_employees" ADD CONSTRAINT "campaign_employees_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "dashboard"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard"."contacts" ADD CONSTRAINT "contacts_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "dashboard"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard"."campaign_contacts" ADD CONSTRAINT "campaign_contacts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "dashboard"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard"."campaign_contacts" ADD CONSTRAINT "campaign_contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "dashboard"."contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard"."call_logs" ADD CONSTRAINT "call_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "dashboard"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard"."call_logs" ADD CONSTRAINT "call_logs_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "dashboard"."contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard"."appointments" ADD CONSTRAINT "appointments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "dashboard"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard"."appointments" ADD CONSTRAINT "appointments_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "dashboard"."contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard"."appointments" ADD CONSTRAINT "appointments_call_log_id_fkey" FOREIGN KEY ("call_log_id") REFERENCES "dashboard"."call_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard"."employee_access" ADD CONSTRAINT "employee_access_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "dashboard"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard"."employee_access" ADD CONSTRAINT "employee_access_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "dashboard"."campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
