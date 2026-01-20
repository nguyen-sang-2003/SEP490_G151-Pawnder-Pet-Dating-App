-- ===========================
-- DATABASE: Pawnder (PostgreSQL, EF Core friendly)
-- ===========================

-- ===========================
-- TABLE: Role
-- ===========================
CREATE TABLE "Role" (
    "RoleId" SERIAL PRIMARY KEY,
    "RoleName" VARCHAR(50) NOT NULL,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: UserStatus
-- ===========================
CREATE TABLE "UserStatus" (
    "UserStatusId" SERIAL PRIMARY KEY,
    "UserStatusName" VARCHAR(50) NOT NULL,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: Address
-- ===========================
CREATE TABLE "Address" (
    "AddressId" SERIAL PRIMARY KEY,
    "Latitude" DECIMAL(9,6),
    "Longitude" DECIMAL(9,6),
    "FullAddress" TEXT NOT NULL,
    "City" VARCHAR(100),
    "District" VARCHAR(100),
    "Ward" VARCHAR(100),
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: User
-- ===========================
CREATE TABLE "User" (
    "UserId" SERIAL PRIMARY KEY,
    "RoleId" INT REFERENCES "Role"("RoleId"),
    "UserStatusId" INT REFERENCES "UserStatus"("UserStatusId"),
    "AddressId" INT REFERENCES "Address"("AddressId"),
    "FullName" VARCHAR(100),
    "Gender" VARCHAR(10),
    "Email" VARCHAR(150) UNIQUE NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "ProviderLogin" VARCHAR(50),
    "TokenJWT" TEXT,
    "IsDeleted" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);
ALTER TABLE "User"
  ADD COLUMN "IsProfileComplete" BOOLEAN NOT NULL DEFAULT FALSE;

-- ===========================
-- TABLE: UserBanHistory
-- ===========================
CREATE TABLE "UserBanHistory" (
    "BanId" SERIAL PRIMARY KEY,
    "UserId" INT NOT NULL REFERENCES "User"("UserId") ON DELETE CASCADE,
    "BanStart" TIMESTAMP NOT NULL DEFAULT NOW(),
    "BanEnd" TIMESTAMP, 
    "BanReason" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW(),
    "IsActive" BOOLEAN DEFAULT TRUE
);

-- ===========================
-- TABLE: Attribute
-- ===========================
CREATE TABLE "Attribute" (
    "AttributeId" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "TypeValue" VARCHAR(50),
    "Unit" VARCHAR(20),
    "Percent" DECIMAL(5,2) DEFAULT 0,
    "IsDeleted" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: AttributeOption
-- ===========================
CREATE TABLE "AttributeOption" (
    "OptionId" SERIAL PRIMARY KEY,
    "AttributeId" INT REFERENCES "Attribute"("AttributeId"),
    "Name" VARCHAR(100) NOT NULL,
    "IsDeleted" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: UserPreference
-- ===========================
CREATE TABLE "UserPreference" (
    "UserId" INT REFERENCES "User"("UserId"),
    "AttributeId" INT REFERENCES "Attribute"("AttributeId"),
    "OptionId" INT NULL REFERENCES "AttributeOption"("OptionId"),
    "MaxValue" INT NULL,
    "MinValue" INT NULL,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY ("UserId", "AttributeId")
);

-- ===========================
-- TABLE: Pet
-- ===========================
-- Note: Age is stored in PetCharacteristic, not here
CREATE TABLE "Pet" (
    "PetId" SERIAL PRIMARY KEY,
    "UserId" INT REFERENCES "User"("UserId"),
    "Name" VARCHAR(100),
    "Breed" VARCHAR(100),
    "Gender" VARCHAR(10),
    "IsActive" BOOLEAN DEFAULT FALSE,
    "IsDeleted" BOOLEAN DEFAULT FALSE,
    "Description" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: PetPhoto
-- ===========================
CREATE TABLE "PetPhoto" (
    "PhotoId"   SERIAL PRIMARY KEY,
    "PetId"     INT NOT NULL REFERENCES "Pet"("PetId") ON DELETE CASCADE,
    "ImageUrl"       TEXT NOT NULL,        -- đổi từ ImageUrl -> Url (khớp EF & code)
    "PublicId"  TEXT,                 -- để xóa Cloudinary
    "IsPrimary" BOOLEAN DEFAULT FALSE,
    "SortOrder" INT DEFAULT 0,
    "IsDeleted" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for PetPhoto
CREATE INDEX "IX_PetPhoto_PetId" ON "PetPhoto"("PetId");

-- Unique index: Mỗi pet chỉ có 1 ảnh primary (chưa bị xóa)
CREATE UNIQUE INDEX "UX_PetPhoto_OnePrimaryPerPet" 
ON "PetPhoto"("PetId", "IsPrimary") 
WHERE "IsDeleted" = FALSE AND "IsPrimary" = TRUE;

-- ===========================
-- TABLE: PetCharacteristic
-- ===========================
CREATE TABLE "PetCharacteristic" (
    "PetId" INT REFERENCES "Pet"("PetId"),
    "AttributeId" INT REFERENCES "Attribute"("AttributeId"),
    "OptionId" INT NULL REFERENCES "AttributeOption"("OptionId"),
    "Value" INT NULL,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY ("PetId", "AttributeId")
);

-- ===========================
-- TABLE: ChatAI
-- ===========================
CREATE TABLE "ChatAI" (
    "ChatAIId" SERIAL PRIMARY KEY,
    "UserId" INT REFERENCES "User"("UserId"),
    "Title" VARCHAR(200),
    "IsDeleted" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: ChatAIContent
-- ===========================
CREATE TABLE "ChatAIContent" (
    "ContentId" SERIAL PRIMARY KEY,
    "ChatAIId" INT REFERENCES "ChatAI"("ChatAIId"),
    "Question" TEXT,
    "Answer" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: ExpertConfirmation
-- ===========================
CREATE TABLE "ExpertConfirmation" (
    "ExpertId" INT REFERENCES "User"("UserId"),
    "UserId" INT REFERENCES "User"("UserId"),
    "ChatAIId" INT REFERENCES "ChatAI"("ChatAIId"),
    "UserQuestion" TEXT,
    "Status" VARCHAR(50),
    "Message" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY ("ExpertId", "UserId", "ChatAIId")
);

-- ===========================
-- TABLE: ChatUser
-- ===========================
CREATE TABLE "ChatUser" (
    "MatchId" SERIAL PRIMARY KEY,
    "FromPetId" INT REFERENCES "Pet"("PetId"),
    "ToPetId" INT REFERENCES "Pet"("PetId"),
    "FromUserId" INT REFERENCES "User"("UserId"),
    "ToUserId" INT REFERENCES "User"("UserId"),
    "Status" VARCHAR(50),
    "IsDeleted" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: ChatUserContent
-- ===========================
CREATE TABLE "ChatUserContent" (
    "ContentId" SERIAL PRIMARY KEY,
    "MatchId" INT REFERENCES "ChatUser"("MatchId"),
    "FromUserId" INT REFERENCES "User"("UserId"),
    "FromPetId" INT REFERENCES "Pet"("PetId"),
    "Message" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: Report
-- ===========================
CREATE TABLE "Report" (
    "ReportId" SERIAL PRIMARY KEY,
    "UserReportId" INT REFERENCES "User"("UserId"),
    "ContentId" INT REFERENCES "ChatUserContent"("ContentId"),
    "Reason" TEXT,
    "Status" VARCHAR(50),
    "Resolution" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: Block
-- ===========================
CREATE TABLE "Block" (
    "FromUserId" INT REFERENCES "User"("UserId"),
    "ToUserId" INT REFERENCES "User"("UserId"),
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY ("FromUserId", "ToUserId")
);

-- ===========================
-- TABLE: PaymentHistory
-- ===========================
CREATE TABLE "PaymentHistory" (
    "HistoryId" SERIAL PRIMARY KEY,
    "UserId" INT REFERENCES "User"("UserId"),
    "StatusService" VARCHAR(100),     -- "ACTIVE", "EXPIRED", "CANCELLED"
    "StartDate" DATE,
    "EndDate" DATE,
    "Amount" DECIMAL(10,2),           -- Số tiền thanh toán VIP (99,000đ)
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: Notification
-- ===========================
CREATE TABLE "Notification" (
    "NotificationId" SERIAL PRIMARY KEY,
    "UserId" INT REFERENCES "User"("UserId"),
    "Title" VARCHAR(200),
    "Message" TEXT,
    "Type" VARCHAR(50),
    "Status" VARCHAR(20) DEFAULT 'SENT' CHECK ("Status" IN ('DRAFT', 'SENT')),
    "IsBroadcast" BOOLEAN DEFAULT FALSE,
    "IsRead" BOOLEAN DEFAULT FALSE,
    "ReferenceId" INT,
    "SentAt" TIMESTAMP,
    "CreatedByUserId" INT REFERENCES "User"("UserId"),
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX "IX_Notification_UserId_IsRead" ON "Notification"("UserId", "IsRead");
CREATE INDEX "IX_Notification_Status" ON "Notification"("Status");
CREATE INDEX "IX_Notification_IsBroadcast" ON "Notification"("IsBroadcast") WHERE "Status" = 'DRAFT';

-- ===========================
-- TABLE: Daily Limit
-- ===========================
CREATE TABLE "DailyLimit" (
    "LimitId" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL REFERENCES "User"("UserId"),
    "ActionType" VARCHAR(100) NOT NULL,   
    "ActionDate" DATE NOT NULL,         
    "Count" INTEGER DEFAULT 1,          
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("UserId", "ActionType", "ActionDate")
);

-- ===========================
-- TABLE: ChatExpert
-- ===========================
CREATE TABLE "ChatExpert" (
    "ChatExpertId" SERIAL PRIMARY KEY,
    "ExpertId" INT REFERENCES "User"("UserId"),
    "UserId" INT REFERENCES "User"("UserId"),
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: ChatExpertContent
-- ===========================
CREATE TABLE "ChatExpertContent" (
    "ContentId" SERIAL PRIMARY KEY,
    "ChatExpertId" INT REFERENCES "ChatExpert"("ChatExpertId"),
    "FromId" INT REFERENCES "User"("UserId"),
    "Message" TEXT,
    "ExpertId" INT,
    "UserId" INT,
    "ChatAIId" INT,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("ExpertId", "UserId", "ChatAIId") 
        REFERENCES "ExpertConfirmation"("ExpertId", "UserId", "ChatAIId")
);

-- ===========================
-- TABLE: BadWord
-- ===========================
CREATE TABLE "BadWord" (
    "BadWordId" SERIAL PRIMARY KEY,
    "Word" VARCHAR(200) NOT NULL,
    "IsRegex" BOOLEAN DEFAULT FALSE,
    "Level" INT NOT NULL CHECK ("Level" >= 1 AND "Level" <= 2),
    "Category" VARCHAR(50),
    "IsActive" BOOLEAN DEFAULT TRUE,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for BadWord
CREATE INDEX "IX_BadWord_IsActive" ON "BadWord"("IsActive");
CREATE INDEX "IX_BadWord_Level" ON "BadWord"("Level");

-- =============================================
-- 1. Bảng Policy - Lưu thông tin chính sách
-- =============================================
CREATE TABLE IF NOT EXISTS "Policy" (
    "PolicyId" SERIAL PRIMARY KEY,
    "PolicyCode" VARCHAR(50) NOT NULL UNIQUE,
    "PolicyName" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "DisplayOrder" INTEGER DEFAULT 0,
    "RequireConsent" BOOLEAN DEFAULT TRUE,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "IsDeleted" BOOLEAN DEFAULT FALSE,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Index cho tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS "IX_Policy_PolicyCode" ON "Policy" ("PolicyCode");
CREATE INDEX IF NOT EXISTS "IX_Policy_IsActive" ON "Policy" ("IsActive") WHERE "IsDeleted" = FALSE;

-- =============================================
-- 2. Bảng PolicyVersion - Lưu các phiên bản của Policy
-- =============================================
CREATE TABLE IF NOT EXISTS "PolicyVersion" (
    "PolicyVersionId" SERIAL PRIMARY KEY,
    "PolicyId" INTEGER NOT NULL,
    "VersionNumber" INTEGER NOT NULL,
    "Title" VARCHAR(300) NOT NULL,
    "Content" TEXT NOT NULL,
    "ChangeLog" TEXT,
    "Status" VARCHAR(20) DEFAULT 'DRAFT' CHECK ("Status" IN ('DRAFT', 'ACTIVE', 'INACTIVE')),
    "PublishedAt" TIMESTAMP WITHOUT TIME ZONE,
    "DeactivatedAt" TIMESTAMP WITHOUT TIME ZONE,
    "CreatedByUserId" INTEGER,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT "PolicyVersion_PolicyId_fkey" 
        FOREIGN KEY ("PolicyId") REFERENCES "Policy"("PolicyId") ON DELETE CASCADE,
    CONSTRAINT "PolicyVersion_CreatedByUserId_fkey" 
        FOREIGN KEY ("CreatedByUserId") REFERENCES "User"("UserId") ON DELETE SET NULL,
    CONSTRAINT "PolicyVersion_PolicyId_VersionNumber_key" 
        UNIQUE ("PolicyId", "VersionNumber")
);

-- Index cho tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS "IX_PolicyVersion_PolicyId_Status" ON "PolicyVersion" ("PolicyId", "Status");
CREATE INDEX IF NOT EXISTS "IX_PolicyVersion_Status" ON "PolicyVersion" ("Status");

-- =============================================
-- 3. Bảng UserPolicyAccept - Lưu lịch sử xác nhận của User
-- =============================================
CREATE TABLE IF NOT EXISTS "UserPolicyAccept" (
    "AcceptId" BIGSERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "PolicyVersionId" INTEGER NOT NULL,
    "AcceptedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    "IsValid" BOOLEAN DEFAULT TRUE,
    "InvalidatedAt" TIMESTAMP WITHOUT TIME ZONE,
    "CreatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT "UserPolicyAccept_UserId_fkey" 
        FOREIGN KEY ("UserId") REFERENCES "User"("UserId") ON DELETE CASCADE,
    CONSTRAINT "UserPolicyAccept_PolicyVersionId_fkey" 
        FOREIGN KEY ("PolicyVersionId") REFERENCES "PolicyVersion"("PolicyVersionId") ON DELETE CASCADE
);

-- Index cho tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS "IX_UserPolicyAccept_UserId_PolicyVersionId_IsValid" 
    ON "UserPolicyAccept" ("UserId", "PolicyVersionId", "IsValid");
CREATE INDEX IF NOT EXISTS "IX_UserPolicyAccept_UserId_IsValid" 
    ON "UserPolicyAccept" ("UserId", "IsValid");
CREATE INDEX IF NOT EXISTS "IX_UserPolicyAccept_PolicyVersionId" 
    ON "UserPolicyAccept" ("PolicyVersionId");


-- ========================
-- Thêm dữ liệu bảng Role
-- ========================
INSERT INTO "Role" ("RoleName") VALUES
('Admin'),
('Expert'),
('User');

-- ========================
-- Thêm dữ liệu bảng UserStatus
-- ========================
INSERT INTO "UserStatus" ("UserStatusName") VALUES
('Bị khóa'),
('Tài khoản thường'),
('Tài khoản VIP');

-- ========================
-- Thêm dữ liệu bảng Attribute
-- ========================
INSERT INTO "Attribute" ("Name", "TypeValue", "Unit", "Percent")
VALUES
('Hình dạng đầu', 'string', NULL, 9),
('Hình dạng mõm', 'string', NULL, 7),
('Màu lông', 'string', NULL, 9),
('Độ dài lông', 'string', NULL, 6),
('Kiểu lông', 'string', NULL, 6),
('Cân nặng', 'float', 'kg', 8),
('Kích thước mắt', 'string', NULL, 7),
('Màu mắt', 'string', NULL, 6),
('Hình dạng tai', 'string', NULL, 7),
('Hình dạng đuôi', 'string', NULL, 4),
('Tỷ lệ chân – thân', 'string', NULL, 3),
('Trạng thái cơ thể', 'string', NULL, 2),
('Tuổi', 'float', 'năm', 2),
('Loại', 'string', NULL, 2),
('Giới tính', 'string', NULL, 2),
('Khoảng cách', 'float', 'km', 5),
('Chiều cao', 'float', 'cm', 5);

-- ========================
-- Thêm dữ liệu bảng AttributeOption
-- ========================
-- 1. Hình dạng đầu
INSERT INTO "AttributeOption" ("AttributeId", "Name") VALUES
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng đầu'), 'Tròn'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng đầu'), 'Cân đối'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng đầu'), 'Dài'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng đầu'), 'Vuông');

-- 2. Hình dạng mõm
INSERT INTO "AttributeOption" ("AttributeId", "Name") VALUES
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng mõm'), 'Ngắn'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng mõm'), 'Trung bình'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng mõm'), 'Dài');

-- 3. Màu lông
INSERT INTO "AttributeOption" ("AttributeId", "Name") VALUES
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Màu lông'), 'Trắng'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Màu lông'), 'Vàng'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Màu lông'), 'Nâu'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Màu lông'), 'Đen'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Màu lông'), 'Xám'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Màu lông'), 'Đỏ'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Màu lông'), 'Bạc'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Màu lông'), 'Xanh'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Màu lông'), 'Đốm');

-- 4. Độ dài lông
INSERT INTO "AttributeOption" ("AttributeId", "Name") VALUES
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Độ dài lông'), 'Ngắn'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Độ dài lông'), 'Trung bình'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Độ dài lông'), 'Dài');

-- 5. Kiểu lông
INSERT INTO "AttributeOption" ("AttributeId", "Name") VALUES
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Kiểu lông'), 'Mượt'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Kiểu lông'), 'Xoăn'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Kiểu lông'), 'Xù'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Kiểu lông'), 'Không lông');

-- 7. Kích thước mắt
INSERT INTO "AttributeOption" ("AttributeId", "Name") VALUES
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Kích thước mắt'), 'Rất to'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Kích thước mắt'), 'To'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Kích thước mắt'), 'Trung bình'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Kích thước mắt'), 'Nhỏ');

-- 8. Màu mắt
INSERT INTO "AttributeOption" ("AttributeId", "Name") VALUES
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Màu mắt'), 'Đen'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Màu mắt'), 'Nâu'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Màu mắt'), 'Vàng'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Màu mắt'), 'Xanh dương'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Màu mắt'), 'Xanh lá'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Màu mắt'), 'Hổ phách');

-- 9. Hình dạng tai
INSERT INTO "AttributeOption" ("AttributeId", "Name") VALUES
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng tai'), 'Dựng'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng tai'), 'Cụp'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng tai'), 'Cụp một phần'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng tai'), 'Dài'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng tai'), 'Ngắn'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng tai'), 'Tròn');

-- 10. Hình dạng đuôi
INSERT INTO "AttributeOption" ("AttributeId", "Name") VALUES
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng đuôi'), 'Thẳng'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng đuôi'), 'Cong nhẹ'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng đuôi'), 'Cong tròn'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng đuôi'), 'Dài'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Hình dạng đuôi'), 'Cụt');

-- 11. Tỷ lệ chân – thân
INSERT INTO "AttributeOption" ("AttributeId", "Name") VALUES
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Tỷ lệ chân – thân'), 'Chân rất ngắn'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Tỷ lệ chân – thân'), 'Chân ngắn'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Tỷ lệ chân – thân'), 'Cân đối'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Tỷ lệ chân – thân'), 'Chân dài'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Tỷ lệ chân – thân'), 'Chân rất dài');

-- 12. Trạng thái cơ thể
INSERT INTO "AttributeOption" ("AttributeId", "Name") VALUES
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Trạng thái cơ thể'), 'Gầy'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Trạng thái cơ thể'), 'Săn chắc'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Trạng thái cơ thể'), 'Cân đối'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Trạng thái cơ thể'), 'Mũm mĩm'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Trạng thái cơ thể'), 'Béo');

-- 15. Giới tính
INSERT INTO "AttributeOption" ("AttributeId", "Name") VALUES
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Giới tính'), 'Đực'),
((SELECT "AttributeId" FROM "Attribute" WHERE "Name" = 'Giới tính'), 'Cái');

-- ===========================
-- BẢNG Address
-- ===========================
INSERT INTO "Address" ("Latitude", "Longitude", "FullAddress", "City", "District", "Ward")
VALUES
(10.762622, 106.660172, '268 Lý Thường Kiệt, Phường 14, Quận 10', 'Hồ Chí Minh', 'Quận 10', 'Phường 14'),
(10.030695, 105.768738, '3/2 Street, Xuân Khánh, Ninh Kiều', 'Cần Thơ', 'Ninh Kiều', 'Xuân Khánh');

-- ===========================
-- BẢNG User
-- ===========================
INSERT INTO "User" (
    "RoleId", 
    "UserStatusId", 
    "AddressId", 
    "FullName", 
    "Gender", 
    "Email", 
    "PasswordHash", 
    "ProviderLogin",
    "IsProfileComplete"
)
VALUES
(
 (SELECT "RoleId" FROM "Role" WHERE "RoleName"='Admin'),
 (SELECT "UserStatusId" FROM "UserStatus" WHERE "UserStatusName"='Tài khoản thường'),
 (SELECT "AddressId" FROM "Address" WHERE "City"='Hồ Chí Minh' LIMIT 1),
 'Nguyễn Văn A', 'Nam', 'admin@pawnder.com',
 '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'local',
 TRUE
),
(
 (SELECT "RoleId" FROM "Role" WHERE "RoleName"='Expert'),
 (SELECT "UserStatusId" FROM "UserStatus" WHERE "UserStatusName"='Tài khoản thường'),
 (SELECT "AddressId" FROM "Address" WHERE "City"='Cần Thơ' LIMIT 1),
 'Trần Thị B', 'Nữ', 'expert@pawnder.com',
 '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'local',
 TRUE
),
(
 (SELECT "RoleId" FROM "Role" WHERE "RoleName"='User'),
 (SELECT "UserStatusId" FROM "UserStatus" WHERE "UserStatusName"='Tài khoản thường'),
 (SELECT "AddressId" FROM "Address" WHERE "City"='Hồ Chí Minh' LIMIT 1),
 'Lê Minh C', 'Nam', 'user1@pawnder.com',
 '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'local',
 TRUE
),
(
 (SELECT "RoleId" FROM "Role" WHERE "RoleName"='User'),
 (SELECT "UserStatusId" FROM "UserStatus" WHERE "UserStatusName"='Tài khoản thường'),
 (SELECT "AddressId" FROM "Address" WHERE "City"='Hồ Chí Minh' LIMIT 1),
 'Lê Minh D', 'Nam', 'user2@pawnder.com',
 '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'local',
 TRUE
);

-- ===========================
-- BẢNG Pet (Age được lưu trong PetCharacteristic)
-- ===========================
INSERT INTO "Pet" ("UserId", "Name", "Breed", "Gender", "Description")
VALUES
((SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'), 'Milo', 'Golden Retriever', 'Đực', 'thân thiện, thích chạy nhảy'),
((SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'), 'Luna', 'Poodle', 'Cái', 'Rất ngoan và dễ thương');

-- ===========================
-- BẢNG PetPhoto
-- ===========================
INSERT INTO "PetPhoto" ("PetId", "ImageUrl")
VALUES
((SELECT "PetId" FROM "Pet" WHERE "Name"='Milo'), 'https://picsum.photos/seed/100/300/300'),
((SELECT "PetId" FROM "Pet" WHERE "Name"='Milo'), 'https://picsum.photos/seed/101/300/300'),
((SELECT "PetId" FROM "Pet" WHERE "Name"='Luna'), 'https://picsum.photos/seed/102/300/300');

-- ===========================
-- BẢNG PetCharacteristic
-- ===========================
INSERT INTO "PetCharacteristic" ("PetId", "AttributeId", "Value")
VALUES
-- Milo characteristics
((SELECT "PetId" FROM "Pet" WHERE "Name"='Milo'),
 (SELECT "AttributeId" FROM "Attribute" WHERE "Name"='Cân nặng'), 25),
((SELECT "PetId" FROM "Pet" WHERE "Name"='Milo'),
 (SELECT "AttributeId" FROM "Attribute" WHERE "Name"='Chiều cao'), 60),
((SELECT "PetId" FROM "Pet" WHERE "Name"='Milo'),
 (SELECT "AttributeId" FROM "Attribute" WHERE "Name"='Tuổi'), 3),
-- Luna characteristics
((SELECT "PetId" FROM "Pet" WHERE "Name"='Luna'),
 (SELECT "AttributeId" FROM "Attribute" WHERE "Name"='Cân nặng'), 8),
((SELECT "PetId" FROM "Pet" WHERE "Name"='Luna'),
 (SELECT "AttributeId" FROM "Attribute" WHERE "Name"='Chiều cao'), 35),
((SELECT "PetId" FROM "Pet" WHERE "Name"='Luna'),
 (SELECT "AttributeId" FROM "Attribute" WHERE "Name"='Tuổi'), 2);

-- ===========================
-- BẢNG UserPreference (giờ không có cột Value nữa)
-- ===========================
INSERT INTO "UserPreference" ("UserId", "AttributeId", "MinValue", "MaxValue")
VALUES
((SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 (SELECT "AttributeId" FROM "Attribute" WHERE "Name"='Chiều cao'), 50, NULL),
((SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'),
 (SELECT "AttributeId" FROM "Attribute" WHERE "Name"='Cân nặng'), NULL, 20);

-- ===========================
-- BẢNG ChatAI
-- ===========================
INSERT INTO "ChatAI" ("UserId", "Title")
VALUES
((SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'), 'Tư vấn giống chó phù hợp'),
((SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'), 'Phân tích gen thú cưng');

-- ===========================
-- BẢNG ChatAIContent
-- ===========================
INSERT INTO "ChatAIContent" ("ChatAIId", "Question", "Answer")
VALUES
-- Chat "Tư vấn giống chó phù hợp" - Đoạn chat dài với nhiều tin nhắn
((SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp'),
 'Tôi muốn nuôi chó hiền, phù hợp trẻ nhỏ. Bạn có thể tư vấn giúp tôi không?', 
 'Chào bạn! Tôi rất vui được tư vấn cho bạn. Golden Retriever là một lựa chọn tuyệt vời cho gia đình có trẻ nhỏ vì chúng rất hiền lành, thân thiện và kiên nhẫn với trẻ em.'),
((SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp'),
 'Golden Retriever có cần không gian rộng không? Nhà tôi chỉ có sân nhỏ thôi.', 
 'Golden Retriever là giống chó lớn và năng động, chúng cần không gian để vận động. Tuy nhiên, nếu bạn có thể đưa chúng đi dạo hàng ngày ít nhất 30-60 phút và có sân nhỏ để chúng chơi, thì vẫn có thể nuôi được.'),
((SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp'),
 'Vậy còn giống nào khác phù hợp với không gian nhỏ hơn không?', 
 'Nếu không gian hạn chế, bạn có thể cân nhắc các giống nhỏ hơn như: Cavalier King Charles Spaniel (rất hiền và thích hợp với trẻ em), Beagle (vui vẻ, thân thiện), hoặc Poodle (thông minh, ít rụng lông).'),
((SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp'),
 'Poodle có dễ chăm sóc không? Tôi nghe nói chúng cần cắt tỉa lông thường xuyên.', 
 'Đúng vậy, Poodle cần được cắt tỉa lông định kỳ khoảng 4-6 tuần một lần. Tuy nhiên, ưu điểm là chúng ít rụng lông, phù hợp với người bị dị ứng. Ngoài ra, Poodle rất thông minh và dễ huấn luyện, rất phù hợp với gia đình có trẻ nhỏ.'),
((SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp'),
 'Cảm ơn bạn! Vậy chi phí nuôi một chú chó như vậy khoảng bao nhiêu một tháng?', 
 'Chi phí nuôi chó phụ thuộc vào nhiều yếu tố. Ước tính hàng tháng: thức ăn (500k-1.5 triệu), chăm sóc sức khỏe (200k-500k), đồ chơi và phụ kiện (100k-300k), cắt tỉa lông (nếu cần, 200k-500k/tháng). Tổng cộng khoảng 1-2.5 triệu/tháng tùy giống và kích thước.'),
((SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp'),
 'Tôi muốn xác nhận lại thông tin này với chuyên gia để chắc chắn. Bạn có thể kết nối tôi với chuyên gia không?', 
 'Tất nhiên! Tôi sẽ gửi yêu cầu của bạn đến chuyên gia để họ xem xét và xác nhận lại thông tin. Chuyên gia sẽ đánh giá chi tiết hơn về từng giống chó và đưa ra lời khuyên phù hợp nhất với tình huống cụ thể của bạn.'),
-- Chat "Phân tích gen thú cưng" - Giữ nguyên
((SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Phân tích gen thú cưng'),
 'Con này có thể phối với giống nào tốt?', 'Phối với Labrador sẽ ra đời con khỏe và dễ huấn luyện.');

-- ===========================
-- BẢNG ExpertConfirmation
-- ===========================
INSERT INTO "ExpertConfirmation" ("ExpertId", "UserId", "ChatAIId", "UserQuestion", "Status", "Message")
VALUES
((SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com'),
 (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 (SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp'),
 'Tôi muốn xác nhận lại thông tin này với chuyên gia để chắc chắn. Bạn có thể kết nối tôi với chuyên gia không?',
 'Pending', 'Người dùng cần xác nhận chuyên gia cho câu trả lời AI về giống chó.'),
((SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com'),
 (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'),
 (SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Phân tích gen thú cưng'),
 'Con này có thể phối với giống nào tốt?',
 'Confirmed', 'Chuyên gia đã kiểm tra và đồng ý với câu trả lời.');

-- ===========================
-- BẢNG ChatUser
-- ===========================
INSERT INTO "ChatUser" ("FromPetId", "ToPetId", "FromUserId", "ToUserId", "Status")
VALUES
((SELECT "PetId" FROM "Pet" WHERE "Name"='Milo'),
 (SELECT "PetId" FROM "Pet" WHERE "Name"='Luna'),
 (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'),
 'Accepted');

-- ===========================
-- BẢNG ChatUserContent
-- ===========================
INSERT INTO "ChatUserContent" ("MatchId", "FromUserId", "FromPetId", "Message")
VALUES
((SELECT "MatchId" FROM "ChatUser" WHERE "Status"='Accepted'),
 (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 (SELECT "PetId" FROM "Pet" WHERE "Name"='Milo'),
 'Chào bạn, tôi muốn nhờ bạn tư vấn cho thú cưng của tôi!'),
((SELECT "MatchId" FROM "ChatUser" WHERE "Status"='Accepted'),
 (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'),
 (SELECT "PetId" FROM "Pet" WHERE "Name"='Luna'),
 'Chào bạn, tôi rất sẵn lòng giúp!');

-- ===========================
-- BẢNG Notification
-- ===========================
INSERT INTO "Notification" ("UserId", "Title", "Message", "Type")
VALUES
((SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 'Chào mừng bạn đến với Pawnder!', 'Bạn đã đăng ký tài khoản thành công.', 'WELCOME'),
((SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'),
 'Có yêu cầu tư vấn mới', 'Người dùng đã gửi yêu cầu tư vấn AI.', 'AI_CONSULTATION');

-- ===========================
-- BẢNG ChatExpert
-- ===========================
INSERT INTO "ChatExpert" ("ExpertId", "UserId")
VALUES
((SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com'),
 (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'));

-- ===========================
-- BẢNG ChatExpertContent
-- ===========================
INSERT INTO "ChatExpertContent" ("ChatExpertId", "FromId", "Message", "ExpertId", "UserId", "ChatAIId")
VALUES
((SELECT "ChatExpertId" FROM "ChatExpert" WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com') AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com') LIMIT 1),
 (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
  null,
 (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com'),
 (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 (SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp')),
((SELECT "ChatExpertId" FROM "ChatExpert" WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com') AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com') LIMIT 1),
 (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 'Xin chào chuyên gia, tôi cần tư vấn về giống chó phù hợp.',
 null,
 null,
 null),
((SELECT "ChatExpertId" FROM "ChatExpert" WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com') AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com') LIMIT 1),
 (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com'),
 'Chào bạn! Tôi đã xem qua yêu cầu của bạn. Golden Retriever thực sự là lựa chọn tốt cho gia đình có trẻ nhỏ.',
 null,
 null,
 null);

-- ===========================
-- BẢNG Report (dữ liệu mẫu giữa các User)
-- ===========================
INSERT INTO "Report" ("UserReportId", "ContentId", "Reason", "Status", "Resolution")
VALUES
-- user1 báo cáo user2 vì spam tin nhắn
((SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 (SELECT "ContentId" FROM "ChatUserContent" WHERE "Message" LIKE 'Chào bạn, tôi muốn nhờ bạn tư vấn%' LIMIT 1),
 '[ReportedUser=Lê Minh D] Người dùng bên kia gửi tin nhắn lặp lại gây phiền.',
 'Pending',
 NULL),
-- user2 báo cáo user1 nhưng đã được xử lý
((SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'),
 (SELECT "ContentId" FROM "ChatUserContent" WHERE "Message" LIKE 'Chào bạn, tôi rất sẵn lòng giúp%' LIMIT 1),
 '[ReportedUser=Lê Minh C] Nội dung bị phản hồi không đúng chủ đề, đề nghị admin kiểm tra.',
 'Resolved',
 'Admin đã nhắc nhở user1 và khóa chat 24h.'),
-- user1 báo cáo thêm một nội dung khác nhưng bị từ chối
((SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 (SELECT "ContentId" FROM "ChatUserContent" WHERE "Message" LIKE 'Chào bạn, tôi rất sẵn lòng giúp%' LIMIT 1),
 '[ReportedUser=Lê Minh D] Báo cáo nhầm, không có bằng chứng vi phạm.',
 'Rejected',
 'Không phát hiện vi phạm, báo cáo bị từ chối.'),
-- user2 báo cáo user1 vì nội dung không phù hợp (chờ xử lý)
((SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'),
 (SELECT "ContentId" FROM "ChatUserContent" WHERE "Message" LIKE 'Chào bạn, tôi muốn nhờ bạn tư vấn%' LIMIT 1),
 '[ReportedUser=Lê Minh C] Người dùng này gửi tin nhắn có nội dung không phù hợp với mục đích của ứng dụng.',
 'Pending',
 NULL),
-- user1 báo cáo user2 vì hành vi quấy rối (đang chờ xử lý)
((SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 (SELECT "ContentId" FROM "ChatUserContent" WHERE "Message" LIKE 'Chào bạn, tôi rất sẵn lòng giúp%' LIMIT 1),
 '[ReportedUser=Lê Minh D] Người dùng này có hành vi quấy rối, gửi tin nhắn liên tục và không tôn trọng người khác.',
 'Pending',
 NULL);

-- ===========================
-- BẢNG BadWord - Dữ liệu mẫu
-- ===========================
-- Level 1: Từ nhẹ - sẽ được che bằng ***
INSERT INTO "BadWord" ("Word", "IsRegex", "Level", "Category", "IsActive") VALUES
('đm', false, 1, 'Thô tục', true),
('clgt', false, 1, 'Thô tục', true),
('vl', false, 1, 'Thô tục', true);

-- Level 2: Từ nặng - sẽ bị block
INSERT INTO "BadWord" ("Word", "IsRegex", "Level", "Category", "IsActive") VALUES
('địt', false, 2, 'Thô tục', true),
('đụ', false, 2, 'Thô tục', true);

-- Level 3: Rất nặng - sẽ bị block
INSERT INTO "BadWord" ("Word", "IsRegex", "Level", "Category", "IsActive") VALUES
('lừa đảo', false, 3, 'Scam', true),
('chuyển tiền', false, 3, 'Scam', true);

-- 1. Seed Data - Tạo các Policy mặc định
-- =============================================
INSERT INTO "Policy" ("PolicyCode", "PolicyName", "Description", "DisplayOrder", "RequireConsent", "IsActive")
VALUES 
    ('TERMS_OF_SERVICE', 'Điều khoản sử dụng', 'Điều khoản và điều kiện sử dụng ứng dụng Pawnder', 1, TRUE, TRUE),
    ('PRIVACY_POLICY', 'Chính sách quyền riêng tư', 'Chính sách bảo vệ thông tin cá nhân của người dùng', 2, TRUE, TRUE)
ON CONFLICT ("PolicyCode") DO NOTHING;

-- =============================================
-- 2. Seed Sample Version (DRAFT) - Admin có thể chỉnh sửa sau
-- =============================================
INSERT INTO "PolicyVersion" ("PolicyId", "VersionNumber", "Title", "Content", "ChangeLog", "Status")
SELECT 
    p."PolicyId",
    1,
    CASE p."PolicyCode"
        WHEN 'TERMS_OF_SERVICE' THEN 'Điều khoản sử dụng Pawnder v1.0'
        WHEN 'PRIVACY_POLICY' THEN 'Chính sách quyền riêng tư Pawnder v1.0'
    END,
    CASE p."PolicyCode"
        WHEN 'TERMS_OF_SERVICE' THEN '
# ĐIỀU KHOẢN SỬ DỤNG (TERMS OF SERVICE)

**Phiên bản:** 1.0  
**Ngày hiệu lực:** Theo ngày phát hành  
**Áp dụng cho:** Toàn bộ người dùng ứng dụng

## 1. Chấp nhận điều khoản

Bằng việc đăng ký tài khoản, đăng nhập hoặc sử dụng ứng dụng Pawnder, người dùng xác nhận rằng đã đọc, hiểu và đồng ý với toàn bộ Điều khoản sử dụng này.

Trong trường hợp người dùng không đồng ý với bất kỳ nội dung nào, người dùng phải chấm dứt ngay việc sử dụng ứng dụng.

Việc tiếp tục sử dụng ứng dụng được xem là sự chấp thuận ràng buộc pháp lý đối với Điều khoản này.

## 2. Điều kiện sử dụng dịch vụ

Người dùng phải đủ 18 tuổi trở lên hoặc đủ năng lực hành vi dân sự theo quy định pháp luật.

Người dùng cam kết:

- Cung cấp thông tin chính xác, trung thực, đầy đủ
- Chịu trách nhiệm về mọi hoạt động phát sinh từ tài khoản

Pawnder có quyền từ chối cung cấp dịch vụ nếu phát hiện thông tin không chính xác hoặc có dấu hiệu gian lận.

## 3. Tài khoản người dùng

Mỗi người dùng chỉ được đăng ký 01 tài khoản.

Người dùng chịu trách nhiệm bảo mật:

- Tên đăng nhập
- Mật khẩu
- Mã xác thực (nếu có)

Pawnder không chịu trách nhiệm đối với thiệt hại phát sinh do người dùng làm lộ thông tin tài khoản.

## 4. Hành vi bị nghiêm cấm

Người dùng không được phép:

- Sử dụng ứng dụng cho mục đích trái pháp luật
- Đăng tải hoặc chia sẻ nội dung:
  - Vi phạm pháp luật
  - Khiêu dâm, phản cảm, bạo lực
  - Xúc phạm, quấy rối, phân biệt đối xử
- Giả mạo danh tính hoặc thông tin
- Can thiệp, phá hoại, khai thác trái phép hệ thống
- Thu thập dữ liệu người dùng khác khi chưa được cho phép

Mọi hành vi vi phạm có thể dẫn đến khóa tài khoản ngay lập tức mà không cần thông báo trước.

## 5. Quyền của Pawnder

Pawnder có toàn quyền:

- Chỉnh sửa, tạm ngưng hoặc chấm dứt dịch vụ
- Gỡ bỏ hoặc hạn chế nội dung vi phạm
- Khóa tạm thời hoặc vĩnh viễn tài khoản người dùng
- Áp dụng các biện pháp kỹ thuật để bảo vệ hệ thống

Quyết định của Pawnder trong các trường hợp này là cuối cùng.

## 6. Giới hạn trách nhiệm

Pawnder không chịu trách nhiệm đối với:

- Thiệt hại gián tiếp, ngẫu nhiên hoặc hệ quả
- Gián đoạn dịch vụ do sự cố kỹ thuật, bảo trì, hoặc yếu tố bất khả kháng
- Hành vi hoặc nội dung do người dùng tạo ra

Trong mọi trường hợp, trách nhiệm (nếu có) của Pawnder không vượt quá chi phí người dùng đã thanh toán cho dịch vụ (nếu có).

## 7. Thay đổi điều khoản

Pawnder có quyền sửa đổi Điều khoản sử dụng bất kỳ lúc nào.

- Phiên bản mới sẽ được công bố chính thức
- Người dùng bắt buộc xác nhận lại
- Không xác nhận → không được tiếp tục sử dụng ứng dụng

## 8. Luật áp dụng và giải quyết tranh chấp

Điều khoản này được điều chỉnh theo pháp luật Việt Nam.

Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết thông qua thương lượng. Trường hợp không đạt được thỏa thuận, tranh chấp sẽ được đưa ra Tòa án có thẩm quyền tại Việt Nam.
'
        WHEN 'PRIVACY_POLICY' THEN '
# CHÍNH SÁCH QUYỀN RIÊNG TƯ (PRIVACY POLICY)

**Phiên bản:** 1.0  
**Ngày hiệu lực:** Theo ngày phát hành

## 1. Nguyên tắc bảo vệ dữ liệu

Pawnder cam kết bảo vệ dữ liệu cá nhân của người dùng theo đúng quy định pháp luật hiện hành và áp dụng các biện pháp kỹ thuật, tổ chức phù hợp nhằm đảm bảo an toàn thông tin.

## 2. Thông tin thu thập

Chúng tôi có thể thu thập các loại thông tin sau:

- **Thông tin định danh:** họ tên, email, số điện thoại
- **Thông tin tài khoản và xác thực**
- **Nội dung người dùng cung cấp:** hình ảnh, mô tả, dữ liệu thú cưng
- **Dữ liệu kỹ thuật:** IP, log truy cập, thiết bị, hành vi sử dụng

## 3. Mục đích sử dụng dữ liệu

Dữ liệu cá nhân được sử dụng để:

- Cung cấp và duy trì dịch vụ
- Xác thực danh tính và bảo mật tài khoản
- Cải thiện chất lượng sản phẩm
- Phòng chống gian lận và hành vi vi phạm
- Tuân thủ nghĩa vụ pháp lý

## 4. Lưu trữ và bảo mật dữ liệu

Dữ liệu được lưu trữ trong thời gian cần thiết cho mục đích sử dụng.

Áp dụng các biện pháp:

- Mã hóa
- Phân quyền truy cập
- Giám sát và ghi log

Pawnder không đảm bảo an toàn tuyệt đối nhưng cam kết nỗ lực tối đa để bảo vệ dữ liệu.

## 5. Chia sẻ dữ liệu

Dữ liệu cá nhân không được chia sẻ cho bên thứ ba, trừ các trường hợp:

- Có sự đồng ý rõ ràng của người dùng
- Theo yêu cầu của cơ quan nhà nước có thẩm quyền
- Phục vụ mục đích bảo mật, phòng chống gian lận
- Đối tác kỹ thuật cần thiết để vận hành hệ thống

## 6. Quyền của người dùng

Người dùng có quyền:

- Yêu cầu truy cập, chỉnh sửa dữ liệu cá nhân
- Yêu cầu xóa tài khoản và dữ liệu liên quan
- Rút lại sự đồng ý (điều này có thể làm gián đoạn dịch vụ)

Yêu cầu sẽ được xử lý trong thời hạn hợp lý theo quy định pháp luật.

## 7. Thay đổi chính sách quyền riêng tư

Chính sách này có thể được cập nhật theo thời gian.

- Mọi thay đổi quan trọng sẽ yêu cầu người dùng xác nhận lại
- Không xác nhận → tạm ngưng quyền sử dụng dịch vụ

## 8. Hiệu lực

Chính sách quyền riêng tư có hiệu lực kể từ thời điểm được phát hành và thay thế cho các phiên bản trước đó.
'
    END,
    'Phiên bản đầu tiên',
    'DRAFT'
FROM "Policy" p
WHERE NOT EXISTS (
    SELECT 1 FROM "PolicyVersion" pv WHERE pv."PolicyId" = p."PolicyId"
);

-- =============================================
-- CHỨC NĂNG 1: PET APPOINTMENT (Hẹn gặp mặt)
-- =============================================

-- ===========================
-- TABLE: PetAppointmentLocation (Địa điểm hẹn gặp Pet-Friendly)
-- ===========================
CREATE TABLE "PetAppointmentLocation" (
    "LocationId" SERIAL PRIMARY KEY,
    "Name" VARCHAR(200) NOT NULL,
    "Address" TEXT NOT NULL,
    "Latitude" DECIMAL(9,6) NOT NULL,
    "Longitude" DECIMAL(9,6) NOT NULL,
    "City" VARCHAR(100),
    "District" VARCHAR(100),
    "IsPetFriendly" BOOLEAN DEFAULT TRUE,
    "PlaceType" VARCHAR(50),              -- park, pet_cafe, vet_clinic, custom
    "GooglePlaceId" VARCHAR(255),          -- Google Maps integration
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- Index for location queries
CREATE INDEX "IX_PetAppointmentLocation_City" ON "PetAppointmentLocation"("City");
CREATE INDEX "IX_PetAppointmentLocation_IsPetFriendly" ON "PetAppointmentLocation"("IsPetFriendly");

-- ===========================
-- TABLE: PetAppointment (Cuộc hẹn gặp giữa 2 thú cưng)
-- ===========================
CREATE TABLE "PetAppointment" (
    "AppointmentId" SERIAL PRIMARY KEY,
    "MatchId" INT NOT NULL REFERENCES "ChatUser"("MatchId"),
    
    -- Pet & User info
    "InviterPetId" INT NOT NULL REFERENCES "Pet"("PetId"),
    "InviteePetId" INT NOT NULL REFERENCES "Pet"("PetId"),
    "InviterUserId" INT NOT NULL REFERENCES "User"("UserId"),
    "InviteeUserId" INT NOT NULL REFERENCES "User"("UserId"),
    
    -- Appointment details
    "AppointmentDateTime" TIMESTAMP NOT NULL,
    "LocationId" INT REFERENCES "PetAppointmentLocation"("LocationId"),
    "ActivityType" VARCHAR(50) NOT NULL,   -- walk, cafe, playdate
    
    -- Status: pending, confirmed, rejected, cancelled, on_going, completed, no_show
    "Status" VARCHAR(30) DEFAULT 'pending',
    
    -- Decision tracking
    "CurrentDecisionUserId" INT REFERENCES "User"("UserId"),
    "CounterOfferCount" INT DEFAULT 0,     -- Max 3 lần
    
    -- Check-in tracking
    "InviterCheckedIn" BOOLEAN DEFAULT FALSE,
    "InviteeCheckedIn" BOOLEAN DEFAULT FALSE,
    "InviterCheckInTime" TIMESTAMP,
    "InviteeCheckInTime" TIMESTAMP,
    
    -- Cancellation info
    "CancelledBy" INT REFERENCES "User"("UserId"),
    "CancelReason" TEXT,
    
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for PetAppointment
CREATE INDEX "IX_PetAppointment_MatchId" ON "PetAppointment"("MatchId");
CREATE INDEX "IX_PetAppointment_Status" ON "PetAppointment"("Status");
CREATE INDEX "IX_PetAppointment_DateTime" ON "PetAppointment"("AppointmentDateTime");
CREATE INDEX "IX_PetAppointment_InviterUserId" ON "PetAppointment"("InviterUserId");
CREATE INDEX "IX_PetAppointment_InviteeUserId" ON "PetAppointment"("InviteeUserId");

-- =============================================
-- CHỨC NĂNG 2: ONLINE EVENT (Sự kiện cuộc thi ảnh/video)
-- =============================================

-- ===========================
-- TABLE: PetEvent (Sự kiện cuộc thi)
-- ===========================
CREATE TABLE "PetEvent" (
    "EventId" SERIAL PRIMARY KEY,
    "Title" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "CoverImageUrl" VARCHAR(500),          -- Poster/Cover image
    
    -- Thời gian
    "StartTime" TIMESTAMP NOT NULL,        -- Bắt đầu event
    "SubmissionDeadline" TIMESTAMP NOT NULL, -- Hết hạn đăng bài
    "EndTime" TIMESTAMP NOT NULL,          -- Kết thúc vote + tính kết quả
    
    -- Status: upcoming, active, submission_closed, voting_ended, completed, cancelled
    "Status" VARCHAR(30) DEFAULT 'upcoming',
    
    -- Phần thưởng
    "PrizeDescription" TEXT,
    "PrizePoints" INT DEFAULT 0,
    
    -- Admin creator
    "CreatedBy" INT NOT NULL REFERENCES "User"("UserId"),
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for PetEvent
CREATE INDEX "idx_event_status" ON "PetEvent"("Status");
CREATE INDEX "idx_event_endtime" ON "PetEvent"("EndTime");

-- ===========================
-- TABLE: EventSubmission (Bài dự thi)
-- ===========================
CREATE TABLE "EventSubmission" (
    "SubmissionId" SERIAL PRIMARY KEY,
    "EventId" INT NOT NULL REFERENCES "PetEvent"("EventId"),
    "UserId" INT NOT NULL REFERENCES "User"("UserId"),
    "PetId" INT NOT NULL REFERENCES "Pet"("PetId"),
    
    -- Media content
    "MediaUrl" VARCHAR(500) NOT NULL,
    "MediaType" VARCHAR(20) NOT NULL,      -- image, video
    "ThumbnailUrl" VARCHAR(500),
    "Caption" VARCHAR(500),
    
    -- Vote tracking (denormalized for fast query)
    "VoteCount" INT DEFAULT 0,
    
    -- Kết quả sau khi tính
    "Rank" INT,                            -- 1, 2, 3 cho top 3
    "IsWinner" BOOLEAN DEFAULT FALSE,
    
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "IsDeleted" BOOLEAN DEFAULT FALSE,
    
    -- Mỗi user chỉ được đăng 1 bài / event
    UNIQUE ("EventId", "UserId")
);

-- Indexes for EventSubmission
CREATE INDEX "idx_submission_event" ON "EventSubmission"("EventId");
CREATE INDEX "idx_submission_votes" ON "EventSubmission"("EventId", "VoteCount" DESC);

-- ===========================
-- TABLE: EventVote (Vote cho bài dự thi)
-- ===========================
CREATE TABLE "EventVote" (
    "VoteId" SERIAL PRIMARY KEY,
    "SubmissionId" INT NOT NULL REFERENCES "EventSubmission"("SubmissionId") ON DELETE CASCADE,
    "UserId" INT NOT NULL REFERENCES "User"("UserId"),
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    
    -- Mỗi user chỉ được vote 1 lần / bài
    UNIQUE ("SubmissionId", "UserId")
);

-- Indexes for EventVote
CREATE INDEX "idx_vote_submission" ON "EventVote"("SubmissionId");
CREATE INDEX "idx_vote_user" ON "EventVote"("UserId");

-- ===========================
-- SAMPLE DATA: PetAppointmentLocation (Địa điểm Pet-Friendly)
-- ===========================
INSERT INTO "PetAppointmentLocation" ("Name", "Address", "Latitude", "Longitude", "City", "District", "IsPetFriendly", "PlaceType") VALUES
('Pet Café Chó Mèo Thành Phố', '123 Nguyễn Huệ, Quận 1', 10.773831, 106.704895, 'Hồ Chí Minh', 'Quận 1', TRUE, 'pet_cafe'),
('Công Viên Tao Đàn', 'Cách Mạng Tháng 8, Quận 3', 10.775320, 106.692320, 'Hồ Chí Minh', 'Quận 3', TRUE, 'park'),
('Puppy Station Coffee', '456 Lê Văn Sỹ, Quận 3', 10.786547, 106.678123, 'Hồ Chí Minh', 'Quận 3', TRUE, 'pet_cafe'),
('Công Viên Gia Định', 'Hoàng Minh Giám, Phú Nhuận', 10.800123, 106.685432, 'Hồ Chí Minh', 'Phú Nhuận', TRUE, 'park'),
('The Paw House', '789 Phan Xích Long, Phú Nhuận', 10.795678, 106.680234, 'Hồ Chí Minh', 'Phú Nhuận', TRUE, 'pet_cafe');

