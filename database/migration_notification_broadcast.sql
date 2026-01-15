-- Migration: Add broadcast notification fields
-- Run this script on existing database to add new columns

-- Add Status column
ALTER TABLE "Notification" 
ADD COLUMN IF NOT EXISTS "Status" VARCHAR(20) DEFAULT 'SENT';

-- Add constraint for Status
ALTER TABLE "Notification" 
DROP CONSTRAINT IF EXISTS "Notification_Status_check";
ALTER TABLE "Notification" 
ADD CONSTRAINT "Notification_Status_check" CHECK ("Status" IN ('DRAFT', 'SENT'));

-- Add IsBroadcast column
ALTER TABLE "Notification" 
ADD COLUMN IF NOT EXISTS "IsBroadcast" BOOLEAN DEFAULT FALSE;

-- Add SentAt column
ALTER TABLE "Notification" 
ADD COLUMN IF NOT EXISTS "SentAt" TIMESTAMP;

-- Add CreatedByUserId column
ALTER TABLE "Notification" 
ADD COLUMN IF NOT EXISTS "CreatedByUserId" INT REFERENCES "User"("UserId");

-- Create indexes
CREATE INDEX IF NOT EXISTS "IX_Notification_UserId_IsRead" ON "Notification"("UserId", "IsRead");
CREATE INDEX IF NOT EXISTS "IX_Notification_Status" ON "Notification"("Status");

-- Update existing notifications to have Status = 'SENT'
UPDATE "Notification" SET "Status" = 'SENT' WHERE "Status" IS NULL;
