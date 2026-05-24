-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "contactId" TEXT;

-- CreateIndex
CREATE INDEX "Appointment_contactId_idx" ON "Appointment"("contactId");
