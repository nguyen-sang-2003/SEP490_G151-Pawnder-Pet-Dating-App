-- ===========================
-- DATABASE: Pawnder (INT version)
-- ===========================

-- ===========================
-- TABLE: Role
-- ===========================
CREATE TABLE Role (
    RoleId SERIAL PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: UserStatus
-- ===========================
CREATE TABLE UserStatus (
    UserStatusId SERIAL PRIMARY KEY,
    UserStatusName VARCHAR(50) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: Address
-- ===========================
CREATE TABLE Address (
    AddressId SERIAL PRIMARY KEY,
    FullAddress TEXT NOT NULL,
    City VARCHAR(100),
    District VARCHAR(100),
    Ward VARCHAR(100),
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: User
-- ===========================
CREATE TABLE "User" (
    UserId SERIAL PRIMARY KEY,
    RoleId INT REFERENCES Role(RoleId),
    UserStatusId INT REFERENCES UserStatus(UserStatusId),
    AddressId INT REFERENCES Address(AddressId),
    FullName VARCHAR(100),
    Gender VARCHAR(10),
    Email VARCHAR(150) UNIQUE NOT NULL,
    PasswordHash TEXT NOT NULL,
    ProviderLogin VARCHAR(50),
    TokenJWT TEXT,
    IsDeleted BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: Attribute
-- ===========================
CREATE TABLE Attribute (
    AttributeId SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    TypeValue VARCHAR(50),
    Unit VARCHAR(20),
    IsDeleted BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: UserPreference
-- ===========================
CREATE TABLE UserPreference (
    UserId INT REFERENCES "User"(UserId),
    AttributeId INT REFERENCES Attribute(AttributeId),
    Value TEXT,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (UserId, AttributeId)
);

-- ===========================
-- TABLE: Pet
-- ===========================
CREATE TABLE Pet (
    PetId SERIAL PRIMARY KEY,
    UserId INT REFERENCES "User"(UserId),
    Name VARCHAR(100),
    Breed VARCHAR(100),
    Gender VARCHAR(10),
    Age INT,
    IsDeadted BOOLEAN DEFAULT FALSE,
    IsDeleted BOOLEAN DEFAULT FALSE,
    Description TEXT,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: PetPhoto
-- ===========================
CREATE TABLE PetPhoto (
    PhotoId SERIAL PRIMARY KEY,
    PetId INT REFERENCES Pet(PetId) ON DELETE CASCADE,
    ImageURL TEXT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: PetCharacteristic
-- ===========================
CREATE TABLE PetCharacteristic (
    PetId INT REFERENCES Pet(PetId),
    AttributeId INT REFERENCES Attribute(AttributeId),
    Value TEXT,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (PetId, AttributeId)
);

-- ===========================
-- TABLE: ChatAI
-- ===========================
CREATE TABLE ChatAI (
    ChatAIId SERIAL PRIMARY KEY,
    UserId INT REFERENCES "User"(UserId),
    Title VARCHAR(200),
    IsDeleted BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: ChatAIContent
-- ===========================
CREATE TABLE ChatAIContent (
    ContentId SERIAL PRIMARY KEY,
    ChatAIId INT REFERENCES ChatAI(ChatAIId) ON DELETE CASCADE,
    Question TEXT,
    Answer TEXT,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: ExpertConfirmation
-- ===========================
CREATE TABLE ExpertConfirmation (
    ExpertId INT REFERENCES "User"(UserId),
    UserId INT REFERENCES "User"(UserId),
    ChatAIId INT REFERENCES ChatAI(ChatAIId),
    Status VARCHAR(50),
    Message TEXT,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (ExpertId, UserId, ChatAIId)
);

-- ===========================
-- TABLE: ChatUser
-- ===========================
CREATE TABLE ChatUser (
    MatchId SERIAL PRIMARY KEY,
    FromUserId INT REFERENCES "User"(UserId),
    ToUserId INT REFERENCES "User"(UserId),
    Status VARCHAR(50),
    IsDeleted BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: ChatUserContent
-- ===========================
CREATE TABLE ChatUserContent (
    ContentId SERIAL PRIMARY KEY,
    MatchId INT REFERENCES ChatUser(MatchId) ON DELETE CASCADE,
    FromUserId INT REFERENCES "User"(UserId),
    Message TEXT,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: Report
-- ===========================
CREATE TABLE Report (
    ReportId SERIAL PRIMARY KEY,
    UserReportId INT REFERENCES "User"(UserId),
    ContentId INT REFERENCES ChatUserContent(ContentId),
    Reason TEXT,
    Status VARCHAR(50),
    Resolution TEXT,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: Block
-- ===========================
CREATE TABLE Block (
    FromUserId INT REFERENCES "User"(UserId),
    ToUserId INT REFERENCES "User"(UserId),
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (FromUserId, ToUserId)
);

-- ===========================
-- TABLE: PaymentHistory
-- ===========================
CREATE TABLE PaymentHistory (
    HistoryId SERIAL PRIMARY KEY,
    UserId INT REFERENCES "User"(UserId),
    StatusService VARCHAR(100),
    StartDate DATE,
    EndDate DATE,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- ===========================
-- TABLE: Notification
-- ===========================
CREATE TABLE Notification (
    NotificationId SERIAL PRIMARY KEY,
    UserId INT REFERENCES "User"(UserId),
    Title VARCHAR(200),
    Message TEXT,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);
