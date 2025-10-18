# Hướng dẫn Setup Pawnder FE-User trên Windows

## Yêu cầu hệ thống

1. **Node.js** (phiên bản 18 trở lên)
   - Tải tại: https://nodejs.org/
   - Kiểm tra: `node --version`

2. **Java JDK** (phiên bản 17)
   - Tải tại: https://adoptium.net/
   - Thiết lập biến môi trường:
     - `JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.x.x`
     - Thêm `%JAVA_HOME%\bin` vào PATH

3. **Android Studio**
   - Tải tại: https://developer.android.com/studio
   - Cài đặt Android SDK (API Level 34)
   - Thiết lập biến môi trường:
     - `ANDROID_HOME=C:\Users\[YourUsername]\AppData\Local\Android\Sdk`
     - Thêm vào PATH:
       - `%ANDROID_HOME%\platform-tools`
       - `%ANDROID_HOME%\emulator`
       - `%ANDROID_HOME%\tools`
       - `%ANDROID_HOME%\tools\bin`

## Cài đặt

### Bước 1: Clone repository
```bash
git clone [repository-url]
cd FE/FE-User
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

Nếu gặp lỗi, thử:
```bash
npm install --legacy-peer-deps
```

### Bước 3: Kiểm tra cấu hình Android
```bash
npx react-native doctor
```

## Chạy ứng dụng

### Bước 1: Khởi động Metro Bundler
Mở terminal đầu tiên:
```bash
npm start
```

### Bước 2: Chạy trên Android
Mở terminal thứ hai:

**Với emulator:**
1. Mở Android Studio
2. Khởi động emulator (AVD Manager)
3. Chạy lệnh:
```bash
npm run android
```

**Với thiết bị thật:**
1. Bật USB Debugging trên điện thoại
2. Kết nối điện thoại qua USB
3. Kiểm tra kết nối: `adb devices`
4. Chạy lệnh:
```bash
npm run android
```

## Xử lý lỗi thường gặp

### Lỗi: "SDK location not found"
Tạo file `android/local.properties`:
```properties
sdk.dir=C:\\Users\\[YourUsername]\\AppData\\Local\\Android\\Sdk
```

### Lỗi: "Unable to load script"
```bash
# Xóa cache
cd android
./gradlew clean
cd ..
npm start -- --reset-cache
```

### Lỗi: "Command failed: gradlew.bat"
```bash
cd android
./gradlew clean
./gradlew build
cd ..
```

### Lỗi: JAVA_HOME không đúng
1. Kiểm tra JAVA_HOME: `echo %JAVA_HOME%`
2. Kiểm tra Java version: `java -version`
3. Đảm bảo sử dụng JDK 17

### Lỗi: Module not found
```bash
# Xóa node_modules và cài lại
rm -rf node_modules
rm package-lock.json
npm install
```

### Lỗi: Port 8081 đã được sử dụng
```bash
# Tìm và kill process
netstat -ano | findstr :8081
taskkill /PID [PID_NUMBER] /F
```

### Lỗi: "Could not connect to development server"
1. Kiểm tra Metro Bundler đang chạy
2. Kiểm tra firewall không chặn port 8081
3. Reload app: Nhấn `R` 2 lần trong app

## Scripts hữu ích

### Clean và rebuild
```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Xóa cache Metro
npm start -- --reset-cache

# Clean toàn bộ
rm -rf node_modules android/app/build
npm install
```

### Chạy lint
```bash
npm run lint
```

### Chạy tests
```bash
npm test
```

## Debug

### Bật Developer Menu trên emulator:
- Nhấn `Ctrl + M` (Windows)

### Bật Developer Menu trên thiết bị thật:
- Lắc điện thoại

### Chrome DevTools:
1. Mở Developer Menu
2. Chọn "Debug"
3. Mở `chrome://inspect` trên Chrome

## Ghi chú

- Luôn đảm bảo Metro Bundler đang chạy trước khi build
- Nếu thay đổi native code (Java/Kotlin), cần rebuild: `npm run android`
- Nếu thay đổi dependencies, cần reinstall và rebuild
- Sử dụng Android Emulator API Level 34 để tương thích tốt nhất

## Liên hệ hỗ trợ

Nếu gặp vấn đề không giải quyết được, vui lòng:
1. Kiểm tra lại tất cả các bước
2. Xem log chi tiết trong terminal
3. Liên hệ team để được hỗ trợ

