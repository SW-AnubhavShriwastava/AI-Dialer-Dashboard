/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dashboard"."campaigns" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "dashboard"."employees" ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "dashboard"."employees"("user_id");

-- AddForeignKey
ALTER TABLE "dashboard"."employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dashboard"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
