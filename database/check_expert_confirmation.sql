-- ============================================
-- SCRIPT KIỂM TRA ExpertConfirmation
-- Kiểm tra xem khi expert xác nhận có lưu vào database không
-- ============================================

-- 1. Xem tất cả ExpertConfirmation hiện tại
SELECT 
    ec."ExpertId",
    ec."UserId",
    ec."ChatAIId",
    ec."Status",
    ec."Message" as "ExpertMessage",
    ec."UserQuestion",
    ec."CreatedAt",
    ec."UpdatedAt",
    e."FullName" as "ExpertName",
    u."FullName" as "UserName",
    cai."Title" as "ChatTitle"
FROM "ExpertConfirmation" ec
LEFT JOIN "User" e ON ec."ExpertId" = e."UserId"
LEFT JOIN "User" u ON ec."UserId" = u."UserId"
LEFT JOIN "ChatAI" cai ON ec."ChatAIId" = cai."ChatAIId"
ORDER BY ec."UpdatedAt" DESC, ec."CreatedAt" DESC;

-- 2. Đếm số lượng theo status
SELECT 
    "Status",
    COUNT(*) as "Số lượng"
FROM "ExpertConfirmation"
GROUP BY "Status"
ORDER BY "Số lượng" DESC;

-- 3. Xem các confirmation đã được xác nhận (Status = 'Confirmed')
SELECT 
    ec."ExpertId",
    ec."UserId",
    ec."ChatAIId",
    ec."Status",
    ec."Message",
    ec."UpdatedAt",
    e."FullName" as "ExpertName",
    u."FullName" as "UserName"
FROM "ExpertConfirmation" ec
LEFT JOIN "User" e ON ec."ExpertId" = e."UserId"
LEFT JOIN "User" u ON ec."UserId" = u."UserId"
WHERE ec."Status" = 'Confirmed' OR ec."Status" = 'confirmed'
ORDER BY ec."UpdatedAt" DESC;

-- 4. Xem các confirmation đang chờ xử lý (Status = 'Pending')
SELECT 
    ec."ExpertId",
    ec."UserId",
    ec."ChatAIId",
    ec."Status",
    ec."Message",
    ec."CreatedAt",
    e."FullName" as "ExpertName",
    u."FullName" as "UserName"
FROM "ExpertConfirmation" ec
LEFT JOIN "User" e ON ec."ExpertId" = e."UserId"
LEFT JOIN "User" u ON ec."UserId" = u."UserId"
WHERE ec."Status" = 'Pending' OR ec."Status" = 'pending'
ORDER BY ec."CreatedAt" DESC;

-- 5. Kiểm tra UpdatedAt có được cập nhật không
-- (Nếu UpdatedAt > CreatedAt, có nghĩa là đã được cập nhật)
SELECT 
    ec."ExpertId",
    ec."UserId",
    ec."ChatAIId",
    ec."Status",
    CASE 
        WHEN ec."UpdatedAt" > ec."CreatedAt" THEN 'Đã cập nhật'
        ELSE 'Chưa cập nhật'
    END as "Trạng thái cập nhật",
    ec."CreatedAt",
    ec."UpdatedAt",
    EXTRACT(EPOCH FROM (ec."UpdatedAt" - ec."CreatedAt")) as "Thời gian cập nhật (giây)"
FROM "ExpertConfirmation" ec
ORDER BY ec."UpdatedAt" DESC;

