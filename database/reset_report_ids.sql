-- ============================================
-- SCRIPT SẮP XẾP LẠI ID CỦA BẢNG Report
-- Reset ID để liên tục từ 1, 2, 3, ...
-- ============================================

-- Bước 1: Xem ID hiện tại
SELECT 
    "ReportId",
    "UserReportId",
    "Status",
    "CreatedAt"
FROM "Report"
ORDER BY "CreatedAt" ASC, "ReportId" ASC;

-- Bước 2: Backup dữ liệu vào bảng tạm
CREATE TEMP TABLE report_backup AS
SELECT * FROM "Report";

-- Bước 3: Xóa tất cả records
DELETE FROM "Report";

-- Bước 4: Reset sequence về 1
ALTER SEQUENCE "Report_ReportId_seq" RESTART WITH 1;

-- Bước 5: Insert lại theo thứ tự CreatedAt (ID sẽ tự động tăng từ 1)
INSERT INTO "Report" ("UserReportId", "ContentId", "Reason", "Status", "Resolution", "CreatedAt", "UpdatedAt")
SELECT 
    "UserReportId",
    "ContentId",
    "Reason",
    "Status",
    "Resolution",
    "CreatedAt",
    "UpdatedAt"
FROM report_backup
ORDER BY "CreatedAt" ASC, "ReportId" ASC;

-- Bước 6: Kiểm tra kết quả - ID đã được sắp xếp lại từ 1, 2, 3, ...
SELECT 
    "ReportId",
    "UserReportId",
    "Status",
    LEFT("Reason", 50) as "Lý do",
    "CreatedAt"
FROM "Report"
ORDER BY "ReportId" ASC;

-- Bước 7: Xóa bảng tạm
DROP TABLE IF EXISTS report_backup;

