# 🚀 Quick Start Guide

## Chạy nhanh trong 3 bước

### 1️⃣ Cài đặt dependencies
```bash
cd FE/FE-User
npm install
```

### 2️⃣ Khởi động Metro
Mở terminal thứ nhất:
```bash
npm start
```

### 3️⃣ Chạy Android
Mở terminal thứ hai (đảm bảo emulator/device đã sẵn sàng):
```bash
npm run android
```

---

## ⚠️ Nếu gặp lỗi

### Lỗi build
```bash
cd android
./gradlew clean
cd ..
npm start -- --reset-cache
npm run android
```

### Lỗi dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Lỗi SDK/Java
- Kiểm tra `ANDROID_HOME`: `echo %ANDROID_HOME%`
- Kiểm tra `JAVA_HOME`: `echo %JAVA_HOME%`
- Xem chi tiết trong `SETUP_WINDOWS.md`

---

## 📚 Tài liệu đầy đủ

- **`README.md`** - Tổng quan project
- **`SETUP_WINDOWS.md`** - Hướng dẫn setup chi tiết cho Windows
- **`CHANGELOG.md`** - Danh sách tất cả thay đổi

---

## ✅ Checklist trước khi chạy

- [ ] Node.js ≥ 18
- [ ] Java JDK 17
- [ ] Android Studio với SDK API 34
- [ ] ANDROID_HOME được set trong biến môi trường
- [ ] JAVA_HOME được set trong biến môi trường
- [ ] Android emulator đang chạy HOẶC device đã kết nối

---

## 🎯 Cấu trúc Project

```
src/
├── api/          - API client & services
├── app/          - Redux store & hooks
├── assets/       - Images, fonts
├── components/   - Reusable components
├── features/     - Feature modules (auth, home, match, profile)
├── navigation/   - Navigation config
├── theme/        - Colors, styles, typography
├── types/        - TypeScript definitions
└── utils/        - Helper functions
```

---

## 💡 Tips

- Reload app: Nhấn `R` 2 lần
- Dev menu: `Ctrl + M` (emulator) hoặc lắc device
- Chrome DevTools: Dev menu → Debug
- Hot reload đã được bật mặc định

---

**Happy Coding! 🐾**

