-- ========================
-- Bảng Role
-- ========================
CREATE TABLE Role (
    RoleId SERIAL PRIMARY KEY,
    RoleName VARCHAR(100) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Bảng UserStatus
-- ========================
CREATE TABLE UserStatus (
    UserStatusId SERIAL PRIMARY KEY,
    UserStatusName VARCHAR(100) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Bảng User
-- ========================
CREATE TABLE "User" (
    UserId SERIAL PRIMARY KEY,
    RoleId INT REFERENCES Role(RoleId),
    UserStatusId INT REFERENCES UserStatus(UserStatusId),
    FullName VARCHAR(150),
    Gender VARCHAR(50),
    Email VARCHAR(150) UNIQUE NOT NULL,
    PasswordHash TEXT NOT NULL,
    TokenJWT TEXT,
	IsDeleted BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Bảng Attribute
-- ========================
CREATE TABLE Attribute (
    AttributeId SERIAL PRIMARY KEY,
    Name VARCHAR(150) NOT NULL,
    TypeValue VARCHAR(100),
    Unit VARCHAR(50),
	IsDeleted BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Bảng Pet
-- ========================
CREATE TABLE Pet (
    PetId SERIAL PRIMARY KEY,
    UserId INT REFERENCES "User"(UserId),
    Name VARCHAR(100),
    Breed VARCHAR(100),
    Gender VARCHAR(50),
    Age INT,
    Description TEXT,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Bảng PetPhoto
-- ========================
CREATE TABLE PetPhoto (
    PhotoId SERIAL PRIMARY KEY,
    PetId INT REFERENCES Pet(PetId),
    ImagePetURL TEXT,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Bảng PetCharacteristic
-- ========================
CREATE TABLE PetCharacteristic (
    PetCharacteristicId SERIAL PRIMARY KEY,
    PetId INT REFERENCES Pet(PetId),
    AttributeId INT REFERENCES Attribute(AttributeId),
    Value VARCHAR(255),
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Bảng UserPreference
-- ========================
CREATE TABLE UserPreference (
    UserPreferenceId SERIAL PRIMARY KEY,
    UserId INT REFERENCES "User"(UserId),
    AttributeId INT REFERENCES Attribute(AttributeId),
    Value VARCHAR(255),
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Bảng ExpertConfirmation
-- ========================
CREATE TABLE ExpertConfirmation (
    ConfirmationId SERIAL PRIMARY KEY,
    UserRequestId INT REFERENCES "User"(UserId),
    ExpertId INT REFERENCES "User"(UserId),
    ContentConfirmation TEXT,
    ContentAccurate BOOLEAN,
    Status VARCHAR(50),
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Bảng PaymentHistory
-- ========================
CREATE TABLE PaymentHistory (
    HistoryId SERIAL PRIMARY KEY,
    UserId INT REFERENCES "User"(UserId),
    StatusService VARCHAR(50),
    StartDate DATE,
    EndDate DATE,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Bảng Block
-- ========================
CREATE TABLE Block (
    BlockId SERIAL PRIMARY KEY,
    FromUserId INT REFERENCES "User"(UserId),
    ToUserId INT REFERENCES "User"(UserId),
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Bảng Report
-- ========================
CREATE TABLE Report (
    ReportId SERIAL PRIMARY KEY,
    FromUserId INT REFERENCES "User"(UserId),
    ToUserId INT REFERENCES "User"(UserId),
    Reason TEXT,
    Status VARCHAR(50),
    Resolution TEXT,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Bảng Notification
-- ========================
CREATE TABLE Notification (
    NotificationId SERIAL PRIMARY KEY,
    UserId INT REFERENCES "User"(UserId),
    Title VARCHAR(150),
    Message TEXT,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Bảng RequestMatch
-- ========================
CREATE TABLE RequestMatch (
    MatchId SERIAL PRIMARY KEY,
    FromUserId INT REFERENCES "User"(UserId),
    ToUserId INT REFERENCES "User"(UserId),
    StatusRequest VARCHAR(50),
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Bảng Message
-- ========================
CREATE TABLE Message (
    MessageId SERIAL PRIMARY KEY,
    MatchId INT REFERENCES RequestMatch(MatchId),
    UserId INT REFERENCES "User"(UserId),
    Content TEXT,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Bảng Location
-- ========================
CREATE TABLE Location (
    LocationId SERIAL PRIMARY KEY,
    UserId INT REFERENCES "User"(UserId),
    Country VARCHAR(100),
    Province VARCHAR(100),
    Commune VARCHAR(100),
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Thêm dữ liệu bảng Role
-- ========================
INSERT INTO Role (RoleName) VALUES
('Admin'),
('Expert'),
('User');

-- ========================
-- Thêm dữ liệu bảng UserStatus
-- ========================
INSERT INTO UserStatus (UserStatusName) VALUES
('Bị khóa'),
('Tài khoản thường'),
('Tài khoản VIP');

-- ========================
-- Thêm dữ liệu bảng Attribute
-- ========================
INSERT INTO Attribute (Name, TypeValue, Unit) VALUES
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
('Nếp nhăn', 'string', NULL),
('Ria', 'boolean', NULL);
