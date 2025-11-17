-- ===========================
-- RESET DAILY LIMITS
-- Script để reset quota AI chat cho testing
-- ===========================

-- Xóa tất cả records ai_chat_question của hôm nay
DELETE FROM "DailyLimit" 
WHERE "ActionType" = 'ai_chat_question' 
AND "ActionDate" = CURRENT_DATE;

-- Hoặc xóa tất cả records (nếu muốn reset toàn bộ)
-- DELETE FROM "DailyLimit" WHERE "ActionType" = 'ai_chat_question';

-- Kiểm tra kết quả
SELECT * FROM "DailyLimit" 
WHERE "ActionType" = 'ai_chat_question' 
ORDER BY "ActionDate" DESC;
