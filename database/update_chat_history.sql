-- ============================================
-- SCRIPT CẬP NHẬT CHAT HISTORY
-- Xóa dữ liệu cũ và thêm lại với 6 tin nhắn
-- ============================================

-- Bước 1: Xóa dữ liệu cũ trong ChatAIContent cho chat "Tư vấn giống chó phù hợp"
DELETE FROM "ChatAIContent"
WHERE "ChatAIId" = (SELECT "ChatAIId" FROM "ChatAI" WHERE "Title" = 'Tư vấn giống chó phù hợp');

-- Bước 2: Kiểm tra ChatAIId thực tế
SELECT "ChatAIId", "Title", "UserId" 
FROM "ChatAI" 
WHERE "Title" = 'Tư vấn giống chó phù hợp';

-- Bước 3: Insert lại 6 tin nhắn mới
INSERT INTO "ChatAIContent" ("ChatAIId", "Question", "Answer")
VALUES
-- Tin nhắn 1
((SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp'),
 'Tôi muốn nuôi chó hiền, phù hợp trẻ nhỏ. Bạn có thể tư vấn giúp tôi không?', 
 'Chào bạn! Tôi rất vui được tư vấn cho bạn. Golden Retriever là một lựa chọn tuyệt vời cho gia đình có trẻ nhỏ vì chúng rất hiền lành, thân thiện và kiên nhẫn với trẻ em.'),
-- Tin nhắn 2
((SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp'),
 'Golden Retriever có cần không gian rộng không? Nhà tôi chỉ có sân nhỏ thôi.', 
 'Golden Retriever là giống chó lớn và năng động, chúng cần không gian để vận động. Tuy nhiên, nếu bạn có thể đưa chúng đi dạo hàng ngày ít nhất 30-60 phút và có sân nhỏ để chúng chơi, thì vẫn có thể nuôi được.'),
-- Tin nhắn 3
((SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp'),
 'Vậy còn giống nào khác phù hợp với không gian nhỏ hơn không?', 
 'Nếu không gian hạn chế, bạn có thể cân nhắc các giống nhỏ hơn như: Cavalier King Charles Spaniel (rất hiền và thích hợp với trẻ em), Beagle (vui vẻ, thân thiện), hoặc Poodle (thông minh, ít rụng lông).'),
-- Tin nhắn 4
((SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp'),
 'Poodle có dễ chăm sóc không? Tôi nghe nói chúng cần cắt tỉa lông thường xuyên.', 
 'Đúng vậy, Poodle cần được cắt tỉa lông định kỳ khoảng 4-6 tuần một lần. Tuy nhiên, ưu điểm là chúng ít rụng lông, phù hợp với người bị dị ứng. Ngoài ra, Poodle rất thông minh và dễ huấn luyện, rất phù hợp với gia đình có trẻ nhỏ.'),
-- Tin nhắn 5
((SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp'),
 'Cảm ơn bạn! Vậy chi phí nuôi một chú chó như vậy khoảng bao nhiêu một tháng?', 
 'Chi phí nuôi chó phụ thuộc vào nhiều yếu tố. Ước tính hàng tháng: thức ăn (500k-1.5 triệu), chăm sóc sức khỏe (200k-500k), đồ chơi và phụ kiện (100k-300k), cắt tỉa lông (nếu cần, 200k-500k/tháng). Tổng cộng khoảng 1-2.5 triệu/tháng tùy giống và kích thước.'),
-- Tin nhắn 6
((SELECT "ChatAIId" FROM "ChatAI" WHERE "Title"='Tư vấn giống chó phù hợp'),
 'Tôi muốn xác nhận lại thông tin này với chuyên gia để chắc chắn. Bạn có thể kết nối tôi với chuyên gia không?', 
 'Tất nhiên! Tôi sẽ gửi yêu cầu của bạn đến chuyên gia để họ xem xét và xác nhận lại thông tin. Chuyên gia sẽ đánh giá chi tiết hơn về từng giống chó và đưa ra lời khuyên phù hợp nhất với tình huống cụ thể của bạn.');

-- Bước 4: Kiểm tra kết quả
SELECT 
    cai."ChatAIId",
    cai."Title",
    COUNT(cac."ContentId") as "Số tin nhắn"
FROM "ChatAI" cai
LEFT JOIN "ChatAIContent" cac ON cai."ChatAIId" = cac."ChatAIId"
WHERE cai."Title" = 'Tư vấn giống chó phù hợp'
GROUP BY cai."ChatAIId", cai."Title";

-- Bước 5: Xem chi tiết tất cả tin nhắn
SELECT 
    cac."ContentId",
    cac."ChatAIId",
    LEFT(cac."Question", 50) as "Câu hỏi",
    LEFT(cac."Answer", 50) as "Câu trả lời",
    cac."CreatedAt"
FROM "ChatAIContent" cac
INNER JOIN "ChatAI" cai ON cac."ChatAIId" = cai."ChatAIId"
WHERE cai."Title" = 'Tư vấn giống chó phù hợp'
ORDER BY cac."CreatedAt" ASC;

