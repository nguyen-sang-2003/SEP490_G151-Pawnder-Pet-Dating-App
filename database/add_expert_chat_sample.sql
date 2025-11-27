-- ============================================
-- SCRIPT THÊM DỮ LIỆU MẪU CHAT EXPERT - USER
-- Chạy script này để thêm ví dụ chat vào database
-- ============================================

-- Xóa dữ liệu cũ (nếu muốn reset)
-- DELETE FROM "ChatExpertContent";
-- DELETE FROM "ChatExpert";

-- Thêm ChatExpert (nếu chưa có)
INSERT INTO "ChatExpert" ("ExpertId", "UserId")
SELECT 
    (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com'),
    (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com')
WHERE NOT EXISTS (
    SELECT 1 FROM "ChatExpert" 
    WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com')
    AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com')
);

INSERT INTO "ChatExpert" ("ExpertId", "UserId")
SELECT 
    (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com'),
    (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com')
WHERE NOT EXISTS (
    SELECT 1 FROM "ChatExpert" 
    WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com')
    AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com')
);

-- Thêm ChatExpertContent cho Chat 1 (Expert - User1)
INSERT INTO "ChatExpertContent" ("ChatExpertId", "FromId", "Message", "ExpertId", "UserId", "ChatAIId")
VALUES
-- Tin nhắn đầu tiên (file chat AI)
((SELECT "ChatExpertId" FROM "ChatExpert" WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com') AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com') LIMIT 1),
 (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 'Đã gửi file đoạn chat AI về tư vấn giống chó phù hợp',
 (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com'),
 (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 (SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp' LIMIT 1)),
-- User1 gửi tin nhắn
((SELECT "ChatExpertId" FROM "ChatExpert" WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com') AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com') LIMIT 1),
 (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 'Xin chào chuyên gia! Tôi đã xem qua câu trả lời từ AI về giống chó phù hợp. Tôi muốn hỏi thêm về chi phí nuôi Golden Retriever có đắt không ạ?',
 NULL,
 NULL,
 NULL),
-- Expert trả lời
((SELECT "ChatExpertId" FROM "ChatExpert" WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com') AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com') LIMIT 1),
 (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com'),
 'Chào bạn! Về chi phí nuôi Golden Retriever, tôi có thể chia sẻ như sau: Chi phí ban đầu (mua chó, vaccine, đồ dùng) khoảng 10-20 triệu. Chi phí hàng tháng: thức ăn (1-1.5 triệu), chăm sóc sức khỏe (200-500k), đồ chơi (100-300k). Tổng cộng khoảng 1.5-2.5 triệu/tháng.',
 NULL,
 NULL,
 NULL),
-- User1 hỏi tiếp
((SELECT "ChatExpertId" FROM "ChatExpert" WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com') AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com') LIMIT 1),
 (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com'),
 'Cảm ơn chuyên gia! Vậy Golden Retriever có dễ huấn luyện không? Tôi chưa có kinh nghiệm nuôi chó.',
 NULL,
 NULL,
 NULL),
-- Expert trả lời
((SELECT "ChatExpertId" FROM "ChatExpert" WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com') AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email"='user1@pawnder.com') LIMIT 1),
 (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com'),
 'Golden Retriever rất thông minh và dễ huấn luyện! Chúng rất thích học hỏi và làm hài lòng chủ. Bạn nên bắt đầu huấn luyện từ khi còn nhỏ (2-3 tháng tuổi). Các lệnh cơ bản như ngồi, nằm, đến đây thường mất 1-2 tuần. Quan trọng là kiên nhẫn và dùng phần thưởng tích cực.',
 NULL,
 NULL,
 NULL);

-- Thêm ChatExpertContent cho Chat 2 (Expert - User2)
INSERT INTO "ChatExpertContent" ("ChatExpertId", "FromId", "Message", "ExpertId", "UserId", "ChatAIId")
VALUES
-- Tin nhắn đầu tiên (file chat AI)
((SELECT "ChatExpertId" FROM "ChatExpert" WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com') AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com') LIMIT 1),
 (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'),
 'Đã gửi file đoạn chat AI về phân tích gen thú cưng',
 (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com'),
 (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'),
 (SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Phân tích gen thú cưng' LIMIT 1)),
-- User2 gửi tin nhắn
((SELECT "ChatExpertId" FROM "ChatExpert" WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com') AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com') LIMIT 1),
 (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'),
 'Chào chuyên gia! Tôi có câu hỏi về phân tích gen. Con chó của tôi là Poodle, tôi muốn biết có thể phối giống với giống nào để có đời con khỏe mạnh?',
 NULL,
 NULL,
 NULL),
-- Expert trả lời
((SELECT "ChatExpertId" FROM "ChatExpert" WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com') AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com') LIMIT 1),
 (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com'),
 'Chào bạn! Poodle có thể phối với nhiều giống khác nhau. Theo phân tích gen, Poodle phối với Labrador sẽ cho đời con khỏe mạnh và dễ huấn luyện (Labradoodle). Ngoài ra, Poodle cũng có thể phối với Golden Retriever (Goldendoodle) hoặc Cocker Spaniel (Cockapoo).',
 NULL,
 NULL,
 NULL),
-- User2 hỏi tiếp
((SELECT "ChatExpertId" FROM "ChatExpert" WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com') AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com') LIMIT 1),
 (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com'),
 'Vậy Labradoodle có đặc điểm gì nổi bật ạ?',
 NULL,
 NULL,
 NULL),
-- Expert trả lời
((SELECT "ChatExpertId" FROM "ChatExpert" WHERE "ExpertId" = (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com') AND "UserId" = (SELECT "UserId" FROM "User" WHERE "Email"='user2@pawnder.com') LIMIT 1),
 (SELECT "UserId" FROM "User" WHERE "Email"='expert@pawnder.com'),
 'Labradoodle là giống lai rất phổ biến! Đặc điểm nổi bật: ít rụng lông (từ Poodle), thông minh và thân thiện (từ Labrador), phù hợp với người bị dị ứng. Chúng rất năng động, thích chơi đùa và rất trung thành với chủ. Kích thước có thể từ nhỏ đến lớn tùy thuộc vào kích thước của Poodle bố mẹ.',
 NULL,
 NULL,
 NULL);

-- Kiểm tra kết quả
SELECT 
    ce."ChatExpertId",
    u1."FullName" as "ExpertName",
    u2."FullName" as "UserName",
    COUNT(cec."ContentId") as "MessageCount"
FROM "ChatExpert" ce
JOIN "User" u1 ON ce."ExpertId" = u1."UserId"
JOIN "User" u2 ON ce."UserId" = u2."UserId"
LEFT JOIN "ChatExpertContent" cec ON ce."ChatExpertId" = cec."ChatExpertId"
WHERE u1."Email" = 'expert@pawnder.com'
GROUP BY ce."ChatExpertId", u1."FullName", u2."FullName"
ORDER BY ce."ChatExpertId";

