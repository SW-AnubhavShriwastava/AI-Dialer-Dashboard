/*
  Warnings:

  - You are about to drop the `employee_access` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "dashboard"."employee_access" DROP CONSTRAINT "employee_access_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "dashboard"."employee_access" DROP CONSTRAINT "employee_access_employee_id_fkey";

-- DropTable
DROP TABLE "dashboard"."employee_access";
