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

-- ===========================
-- TABLE: Attribute
-- ===========================
CREATE TABLE "Attribute" (
    "AttributeId" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "TypeValue" VARCHAR(50),
    "Unit" VARCHAR(20),
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
CREATE TABLE "Pet" (
    "PetId" SERIAL PRIMARY KEY,
    "UserId" INT REFERENCES "User"("UserId"),
    "Name" VARCHAR(100),
    "Breed" VARCHAR(100),
    "Gender" VARCHAR(10),
    "Age" INT,
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
    "PhotoId" SERIAL PRIMARY KEY,
    "PetId" INT REFERENCES "Pet"("PetId"),
    "ImageUrl" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);

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
    "StatusService" VARCHAR(100),
    "StartDate" DATE,
    "EndDate" DATE,
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
    "CreatedAt" TIMESTAMP DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP DEFAULT NOW()
);



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
INSERT INTO "Attribute" ("Name", "TypeValue", "Unit") VALUES
('Chiều cao', 'float', 'cm'),
('Cân nặng', 'float', 'kg'),
('Dáng người', 'string', NULL),
('Tỷ lệ cơ thể', 'string', NULL),
('Hình dạng đầu', 'string', NULL),
('Mắt', 'string', NULL),
('Tai', 'string', NULL),
('Mũi', 'string', NULL),
('Mõm', 'string', NULL),
('Hàm/răng', 'string', NULL),
('Nếp nhăn', 'string', NULL);

-- ===========================
-- BẢNG Address
-- ===========================
INSERT INTO "Address" ("FullAddress", "City", "District", "Ward")
VALUES
('123 Lý Thường Kiệt, Quận 10, Hồ Chí Minh', 'Hồ Chí Minh', 'Quận 10', 'Phường 6'),
('25 Nguyễn Huệ, Quận 1, Hồ Chí Minh', 'Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé'),
('99 Võ Văn Kiệt, Quận Ninh Kiều, Cần Thơ', 'Cần Thơ', 'Ninh Kiều', 'An Hòa');

-- ===========================
-- BẢNG User
-- ===========================
INSERT INTO "User" ("RoleId", "UserStatusId", "AddressId", "FullName", "Gender", "Email", "PasswordHash", "ProviderLogin")
VALUES
((SELECT "RoleId" FROM "Role" WHERE "RoleName"='Admin'),
 (SELECT "UserStatusId" FROM "UserStatus" WHERE "UserStatusName"='Tài khoản thường'),
 (SELECT "AddressId" FROM "Address" WHERE "City"='Hồ Chí Minh' LIMIT 1),
 'Nguyễn Văn A', 'Nam', 'admin@pawnder.com',
 '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'local'),

((SELECT "RoleId" FROM "Role" WHERE "RoleName"='Expert'),
 (SELECT "UserStatusId" FROM "UserStatus" WHERE "UserStatusName"='Tài khoản thường'),
 (SELECT "AddressId" FROM "Address" WHERE "City"='Cần Thơ' LIMIT 1),
 'Trần Thị B', 'Nữ', 'expert@pawnder.com',
 '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'local'),

((SELECT "RoleId" FROM "Role" WHERE "RoleName"='User'),
 (SELECT "UserStatusId" FROM "UserStatus" WHERE "UserStatusName"='Tài khoản thường'),
 (SELECT "AddressId" FROM "Address" WHERE "City"='Hồ Chí Minh' LIMIT 1),
 'Lê Minh C', 'Nam', 'user1@pawnder.com',
 '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'local'),

((SELECT "RoleId" FROM "Role" WHERE "RoleName"='User'),
 (SELECT "UserStatusId" FROM "UserStatus" WHERE "UserStatusName"='Tài khoản thường'),
 (SELECT "AddressId" FROM "Address" WHERE "City"='Hồ Chí Minh' LIMIT 1),
 'Lê Minh D', 'Nam', 'user2@pawnder.com',
 '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'local');

-- ===========================
-- BẢNG Pet
-- ===========================
INSERT INTO "Pet" ("UserId", "Name", "Breed", "Gender", "Age", "Description")
VALUES
((SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'), 'Milo', 'Golden Retriever', 'Đực', 3, 'Chó thân thiện, thích chạy nhảy'),
((SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'), 'Luna', 'Poodle', 'Cái', 2, 'Rất ngoan và dễ thương');

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
((SELECT "PetId" FROM "Pet" WHERE "Name"='Milo'),
 (SELECT "AttributeId" FROM "Attribute" WHERE "Name"='Cân nặng'), 25),
((SELECT "PetId" FROM "Pet" WHERE "Name"='Milo'),
 (SELECT "AttributeId" FROM "Attribute" WHERE "Name"='Chiều cao'), 60),
((SELECT "PetId" FROM "Pet" WHERE "Name"='Luna'),
 (SELECT "AttributeId" FROM "Attribute" WHERE "Name"='Cân nặng'), 8),
((SELECT "PetId" FROM "Pet" WHERE "Name"='Luna'),
 (SELECT "AttributeId" FROM "Attribute" WHERE "Name"='Chiều cao'), 35);

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
((SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp'),
 'Tôi muốn nuôi chó hiền, phù hợp trẻ nhỏ.', 'Golden Retriever là lựa chọn tốt.'),
((SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Phân tích gen thú cưng'),
 'Con này có thể phối với giống nào tốt?', 'Phối với Labrador sẽ ra đời con khỏe và dễ huấn luyện.');

-- ===========================
-- BẢNG ExpertConfirmation
-- ===========================
INSERT INTO "ExpertConfirmation" ("ExpertId", "UserId", "ChatAIId", "Status", "Message")
VALUES
((SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com'),
 (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 (SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp'),
 'Approved', 'Tư vấn đã được chuyên gia xác nhận.');

-- ===========================
-- BẢNG ChatUser
-- ===========================
INSERT INTO "ChatUser" ("FromUserId", "ToUserId", "Status")
VALUES
((SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'),
 'Matched');

-- ===========================
-- BẢNG ChatUserContent
-- ===========================
INSERT INTO "ChatUserContent" ("MatchId", "FromUserId", "Message")
VALUES
((SELECT "MatchId" FROM "ChatUser" WHERE "Status"='Matched'),
 (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 'Chào bạn, tôi muốn nhờ bạn tư vấn cho thú cưng của tôi!'),
((SELECT "MatchId" FROM "ChatUser" WHERE "Status"='Matched'),
 (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'),
 'Chào bạn, tôi rất sẵn lòng giúp!');

-- ===========================
-- BẢNG Notification
-- ===========================
INSERT INTO "Notification" ("UserId", "Title", "Message")
VALUES
((SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 'Chào mừng bạn đến với Pawnder!', 'Bạn đã đăng ký tài khoản thành công.'),
((SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'),
 'Có yêu cầu tư vấn mới', 'Người dùng đã gửi yêu cầu tư vấn AI.');
