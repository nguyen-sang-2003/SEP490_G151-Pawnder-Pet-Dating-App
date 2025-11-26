# Pawnder Admin - Test Account

## 🔐 Admin Test Account

Để test ứng dụng admin trong quá trình phát triển front-end, bạn có thể sử dụng account admin sau:

### 📧 **Thông tin đăng nhập:**
```
Email: admin@pawnder.com
Password: admin123
```

### 👤 **Thông tin user:**
- **ID**: 1
- **Username**: admin
- **Name**: Admin Pawnder
- **Role**: admin
- **Status**: active

### 🚀 **Cách sử dụng:**

1. **Chạy ứng dụng:**
   ```bash
   cd FE/fe-admin
   npm start
   ```

2. **Truy cập:** `http://localhost:3000`

3. **Đăng nhập** với thông tin trên

4. **Sau khi đăng nhập thành công**, bạn sẽ được chuyển đến Dashboard

### 🔧 **Tính năng có thể test:**

- ✅ **Authentication** - Đăng nhập/đăng xuất
- ✅ **Protected Routes** - Chỉ admin mới truy cập được
- ✅ **Dashboard** - Thống kê và hoạt động
- ✅ **User Management** - Quản lý người dùng
- ✅ **Pet Management** - Quản lý thú cưng
- ✅ **Report Management** - Quản lý báo cáo
- ✅ **Theme Toggle** - Chuyển đổi dark/light mode
- ✅ **Responsive Design** - Giao diện responsive

### 📝 **Lưu ý:**

- Account này chỉ dành cho **development/testing**
- Không sử dụng trong **production**
- Token được lưu trong **localStorage**
- Có thể **logout** để test lại flow đăng nhập

### 🎯 **Test Cases:**

1. **Đăng nhập thành công** với đúng thông tin
2. **Đăng nhập thất bại** với sai thông tin
3. **Validation** email và password
4. **Loading state** khi đăng nhập
5. **Redirect** sau khi đăng nhập thành công
6. **Logout** và clear session
7. **Protected routes** không cho phép truy cập khi chưa đăng nhập

---

**Happy Coding! 🎉**
