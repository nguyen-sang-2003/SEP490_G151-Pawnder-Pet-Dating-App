# Hướng dẫn Deploy Database lên Azure

## Bước 1: Tạo Azure Database for PostgreSQL

### Qua Azure Portal:
1. Truy cập: https://portal.azure.com
2. Tìm "Azure Database for PostgreSQL flexible servers"
3. Click **Create**
4. Cấu hình:
   - **Resource group**: Chọn cùng resource group với backend
   - **Server name**: `pawnder-db` (hoặc tên bạn muốn)
   - **Region**: East Asia (cùng region với backend)
   - **PostgreSQL version**: 14 hoặc 15
   - **Compute + storage**: 
     - Tier: Burstable (để tiết kiệm chi phí)
     - Size: B1ms (1 vCPU, 2GB RAM)
   - **Admin username**: `pawnderadmin`
   - **Password**: Tạo password mạnh và lưu lại
5. Click **Review + create** → **Create**

### Qua Azure CLI:
```bash
# Login
az login

# Tạo database server
az postgres flexible-server create \
  --name pawnder-db \
  --resource-group <your-resource-group> \
  --location eastasia \
  --admin-user pawnderadmin \
  --admin-password <your-strong-password> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 14 \
  --storage-size 32

# Tạo database
az postgres flexible-server db create \//
  --resource-group <your-resource-group> \
  --server-name pawnder-db \
  --database-name pawnder_database
```

## Bước 2: Cấu hình Firewall Rules

### Cho phép kết nối từ Azure Services:
```bash
az postgres flexible-server firewall-rule create \
  --resource-group <your-resource-group> \
  --name pawnder-db \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### Cho phép kết nối từ IP của bạn (để import database):
```bash
az postgres flexible-server firewall-rule create \
  --resource-group <your-resource-group> \
  --name pawnder-db \
  --rule-name AllowMyIP \
  --start-ip-address <your-ip> \
  --end-ip-address <your-ip>
```

## Bước 3: Import Database

### Cách 1: Dùng psql (Khuyến nghị)
```bash
# Cài đặt PostgreSQL client nếu chưa có
# Windows: Download từ https://www.postgresql.org/download/windows/

# Import database
psql "host=pawnder-db.postgres.database.azure.com port=5432 dbname=pawnder_database user=pawnderadmin sslmode=require" -f pawnder_database.sql
```

### Cách 2: Dùng pgAdmin
1. Mở pgAdmin
2. Add New Server:
   - **Name**: Pawnder Azure DB
   - **Host**: `pawnder-db.postgres.database.azure.com`
   - **Port**: 5432
   - **Database**: `pawnder_database`
   - **Username**: `pawnderadmin`
   - **Password**: <your-password>
   - **SSL Mode**: Require
3. Kết nối và chạy file SQL

### Cách 3: Dùng Azure CLI
```bash
# Upload file và chạy
az postgres flexible-server execute \
  --name pawnder-db \
  --resource-group <your-resource-group> \
  --admin-user pawnderadmin \
  --admin-password <your-password> \
  --database-name pawnder_database \
  --queryFile pawnder_database.sql
```

## Bước 4: Cập nhật Connection String

Connection string mới sẽ có dạng:
```
Host=pawnder-db.postgres.database.azure.com;Port=5432;Database=pawnder_database;Username=pawnderadmin;Password=<your-password>;SSL Mode=Require;Trust Server Certificate=true
```

### Cập nhật trong Azure App Service:
```bash
az webapp config connection-string set \
  --name pawnder-backend-2024 \
  --resource-group <your-resource-group> \
  --connection-string-type PostgreSQL \
  --settings DbContext="Host=pawnder-db.postgres.database.azure.com;Port=5432;Database=pawnder_database;Username=pawnderadmin;Password=<your-password>;SSL Mode=Require;Trust Server Certificate=true"
```

Hoặc qua Azure Portal:
1. Vào App Service → Configuration
2. Connection strings → New connection string
3. Name: `DbContext`
4. Value: connection string ở trên
5. Type: PostgreSQL
6. Save và Restart app

## Bước 5: Kiểm tra

1. Restart backend: `az webapp restart --name pawnder-backend-2024 --resource-group <your-resource-group>`
2. Truy cập Swagger: https://pawnder-backend-2024-bwajcqa2axg9fjcf.eastasia-01.azurewebsites.net/swagger/index.html
3. Test các API endpoint

## Chi phí ước tính (Azure Database for PostgreSQL Flexible Server)

- **Burstable B1ms**: ~$12-15/tháng
- **Storage 32GB**: ~$4/tháng
- **Tổng**: ~$16-20/tháng

## Lưu ý

- Supabase miễn phí 500MB, phù hợp cho development
- Azure Database tốn phí nhưng tích hợp tốt với App Service
- Nên dùng Supabase cho testing, Azure cho production
- Nhớ backup database định kỳ
