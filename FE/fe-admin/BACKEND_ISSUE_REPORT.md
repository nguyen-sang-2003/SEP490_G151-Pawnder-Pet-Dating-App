# Backend Issue Report - Login SQL Error

## 🐛 Vấn đề phát hiện

Từ log backend, phát hiện SQL query có lỗi syntax trong JOIN condition:

### SQL Query có vấn đề:
```sql
SELECT u."UserId", ...
FROM "User" u
LEFT JOIN "Role" r ON u. "RoleId" r. "RoleId"  -- ❌ THIẾU DẤU "="
WHERE u. "Email" = @__request_Email_0
LIMIT 1
```

### SQL Query đúng phải là:
```sql
SELECT u."UserId", ...
FROM "User" u
LEFT JOIN "Role" r ON u."RoleId" = r."RoleId"  -- ✅ CÓ DẤU "="
WHERE u."Email" = @__request_Email_0
LIMIT 1
```

## 📍 Vị trí lỗi

**File:** `BE/BE/Controllers/AuthController.cs`
**Line:** 31
```csharp
var user = _context.Users.Include(u => u.Role).FirstOrDefault(u => u.Email == request.Email);
```

## 🔍 Nguyên nhân

Entity Framework Core đang generate SQL query với JOIN condition thiếu dấu `=`. Có thể do:
1. Cấu hình relationship trong `PawnderDatabaseContext.cs` chưa đúng
2. Hoặc có vấn đề với cách EF Core map foreign key

## ✅ Giải pháp (cần sửa ở Backend)

### Cách 1: Kiểm tra relationship configuration

**File:** `BE/BE/Models/PawnderDatabaseContext.cs`

Đảm bảo relationship được cấu hình đúng:
```csharp
entity.HasOne(d => d.Role).WithMany(p => p.Users)
    .HasForeignKey(d => d.RoleId)
    .HasConstraintName("User_RoleId_fkey");
```

### Cách 2: Sử dụng explicit join thay vì Include

**File:** `BE/BE/Controllers/AuthController.cs`

Thay đổi từ:
```csharp
var user = _context.Users.Include(u => u.Role).FirstOrDefault(u => u.Email == request.Email);
```

Thành:
```csharp
var user = await _context.Users
    .Where(u => u.Email == request.Email)
    .Select(u => new
    {
        User = u,
        Role = u.Role
    })
    .FirstOrDefaultAsync();

if (user == null)
{
    return Unauthorized("Tài khoản không tồn tại");
}

var userEntity = user.User;
```

### Cách 3: Load Role riêng biệt

```csharp
var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
if (user == null)
{
    return Unauthorized("Tài khoản không tồn tại");
}

// Load Role separately if needed
if (user.RoleId.HasValue)
{
    await _context.Entry(user)
        .Reference(u => u.Role)
        .LoadAsync();
}
```

### Cách 4: Kiểm tra database schema

Đảm bảo foreign key constraint tồn tại:
```sql
ALTER TABLE "User" 
ADD CONSTRAINT "User_RoleId_fkey" 
FOREIGN KEY ("RoleId") 
REFERENCES "Role"("RoleId");
```

## 📊 Impact

- **Login không hoạt động** - Backend throw exception khi query user với Role
- **500 Internal Server Error** - Frontend nhận 500 error thay vì 401
- **User không thể đăng nhập** - Ảnh hưởng trực tiếp đến chức năng chính

## 🔧 Workaround tạm thời (Frontend)

Frontend đã được cập nhật để:
1. ✅ Log chi tiết error từ backend
2. ✅ Hiển thị error message rõ ràng
3. ✅ Xử lý 500 error đặc biệt

## 📝 Next Steps

1. **Backend Developer** cần fix SQL query generation issue
2. **Database Admin** cần kiểm tra foreign key constraints
3. **Frontend** đã sẵn sàng, chỉ cần backend fix xong là hoạt động

## 🧪 Test sau khi fix

1. Start backend
2. Thử login với `admin@pawnder.com` / `123456`
3. Kiểm tra console log xem có còn SQL error không
4. Kiểm tra Network tab xem response từ backend

---

**Ngày báo cáo:** 2024-01-XX  
**Trạng thái:** ⚠️ Backend cần fix  
**Priority:** 🔴 High (Blocking login functionality)

