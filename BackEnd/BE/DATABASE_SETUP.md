# Hướng dẫn cấu hình Database PostgreSQL

## Lỗi: password authentication failed for user "postgres"

### Nguyên nhân:
Backend không thể kết nối đến PostgreSQL vì mật khẩu trong `appsettings.json` không đúng với mật khẩu PostgreSQL của bạn.

### Cách sửa:

#### 1. Kiểm tra mật khẩu PostgreSQL của bạn:
- Mở **pgAdmin 4** hoặc **psql**
- Thử đăng nhập với:
  - **Username**: `postgres`
  - **Password**: (mật khẩu bạn đã đặt khi cài PostgreSQL)

#### 2. Cập nhật Connection String trong `appsettings.json`:

Mở file `BE/BE/appsettings.json` và tìm dòng:
```json
"ConnectionStrings": {
  "DbContext": "Host=localhost;Port=5432;Database=pawnder_database;Username=postgres;Password=123"
}
```

**Thay `Password=123` bằng mật khẩu PostgreSQL thực tế của bạn.**

Ví dụ nếu mật khẩu của bạn là `mypassword123`:
```json
"ConnectionStrings": {
  "DbContext": "Host=localhost;Port=5432;Database=pawnder_database;Username=postgres;Password=mypassword123"
}
```

#### 3. Đảm bảo PostgreSQL Service đang chạy:
- Mở **Services** (Windows + R → `services.msc`)
- Tìm **postgresql-x64-XX** (XX là version)
- Đảm bảo service đang **Running**
- Nếu không, click **Start**

#### 4. Kiểm tra Database đã được tạo chưa:
- Mở **pgAdmin 4**
- Kết nối đến PostgreSQL server
- Kiểm tra xem có database tên `pawnder_database` chưa
- Nếu chưa có, chạy script SQL trong folder `database/pawnder_database.sql`

#### 5. Chạy lại Backend:
- Sau khi cập nhật `appsettings.json`, **restart** backend
- Thử đăng nhập lại từ frontend

### Các trường hợp khác:

#### Nếu bạn dùng port khác (không phải 5432):
```json
"DbContext": "Host=localhost;Port=YOUR_PORT;Database=pawnder_database;Username=postgres;Password=YOUR_PASSWORD"
```

#### Nếu bạn dùng username khác (không phải postgres):
```json
"DbContext": "Host=localhost;Port=5432;Database=pawnder_database;Username=YOUR_USERNAME;Password=YOUR_PASSWORD"
```

#### Nếu bạn dùng database name khác:
```json
"DbContext": "Host=localhost;Port=5432;Database=YOUR_DATABASE_NAME;Username=postgres;Password=YOUR_PASSWORD"
```

### Kiểm tra kết nối:

Sau khi cập nhật, bạn có thể test kết nối bằng cách:
1. Chạy backend
2. Kiểm tra console log - không còn lỗi database connection
3. Thử đăng nhập từ frontend

### Lưu ý bảo mật:

⚠️ **KHÔNG commit file `appsettings.json` có chứa mật khẩu thật vào Git!**

Nên sử dụng:
- `appsettings.Development.json` cho development (có thể commit)
- `appsettings.Production.json` cho production (KHÔNG commit)
- Hoặc sử dụng **User Secrets** hoặc **Environment Variables**

