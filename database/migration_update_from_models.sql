-- ===========================
-- MIGRATION SCRIPT: Cập nhật Database theo Models
-- ===========================
-- Script này cập nhật database hiện có để khớp với Models trong Backend
-- Chạy script này trên database đã tồn tại

-- ===========================
-- 1. Thêm cột FromUserId và ToUserId vào bảng ChatUser
-- ===========================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ChatUser' AND column_name = 'FromUserId'
    ) THEN
        ALTER TABLE "ChatUser" 
        ADD COLUMN "FromUserId" INT REFERENCES "User"("UserId");
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ChatUser' AND column_name = 'ToUserId'
    ) THEN
        ALTER TABLE "ChatUser" 
        ADD COLUMN "ToUserId" INT REFERENCES "User"("UserId");
    END IF;
END $$;

-- ===========================
-- 2. Thêm cột ReferenceId vào bảng Notification
-- ===========================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Notification' AND column_name = 'ReferenceId'
    ) THEN
        ALTER TABLE "Notification" 
        ADD COLUMN "ReferenceId" INT;
    END IF;
END $$;

-- ===========================
-- 3. Thêm cột FromUserId vào bảng ChatUserContent
-- ===========================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ChatUserContent' AND column_name = 'FromUserId'
    ) THEN
        ALTER TABLE "ChatUserContent" 
        ADD COLUMN "FromUserId" INT REFERENCES "User"("UserId");
    END IF;
END $$;

-- ===========================
-- 4. Cập nhật constraint ON DELETE CASCADE cho PetPhoto
-- ===========================
-- Xóa foreign key cũ nếu tồn tại
DO $$ 
BEGIN
    -- Kiểm tra và xóa constraint cũ
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'PetPhoto_PetId_fkey'
    ) THEN
        ALTER TABLE "PetPhoto" 
        DROP CONSTRAINT "PetPhoto_PetId_fkey";
    END IF;
    
    -- Thêm lại với ON DELETE CASCADE
    ALTER TABLE "PetPhoto" 
    ADD CONSTRAINT "PetPhoto_PetId_fkey" 
    FOREIGN KEY ("PetId") 
    REFERENCES "Pet"("PetId") 
    ON DELETE CASCADE;
END $$;

-- ===========================
-- 5. Thêm Indexes cho PetPhoto
-- ===========================
-- Index trên PetId
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'IX_PetPhoto_PetId'
    ) THEN
        CREATE INDEX "IX_PetPhoto_PetId" ON "PetPhoto"("PetId");
    END IF;
END $$;

-- Unique index: Mỗi pet chỉ có 1 ảnh primary (chưa bị xóa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'UX_PetPhoto_OnePrimaryPerPet'
    ) THEN
        CREATE UNIQUE INDEX "UX_PetPhoto_OnePrimaryPerPet" 
        ON "PetPhoto"("PetId", "IsPrimary") 
        WHERE "IsDeleted" = FALSE AND "IsPrimary" = TRUE;
    END IF;
END $$;

-- ===========================
-- Hoàn thành migration
-- ===========================
SELECT 'Migration completed successfully!' AS status;

