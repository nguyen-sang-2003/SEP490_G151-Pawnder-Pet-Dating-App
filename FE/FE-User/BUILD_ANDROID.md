# Hướng dẫn Build và Cài Đặt APK Android

## Build Release APK

### Cách 1: Sử dụng npm scripts (Khuyến nghị)

```bash
cd FE/FE-User
npm run build:android:release
```

### Cách 2: Sử dụng Gradle trực tiếp

```bash
cd FE/FE-User/android
./gradlew assembleRelease
```

Trên Windows (PowerShell):
```powershell
cd FE/FE-User/android
.\gradlew.bat assembleRelease
```

## Tìm File APK

Sau khi build xong, file APK sẽ nằm tại:
```
FE/FE-User/android/app/build/outputs/apk/release/app-release.apk
```

## Cài Đặt APK trên Thiết Bị Android

### Cách 1: Chuyển file APK sang điện thoại

1. Copy file `app-release.apk` vào điện thoại Android (qua USB, email, cloud storage, etc.)
2. Trên điện thoại, mở Settings → Security → Enable "Install from Unknown Sources" (hoặc tương tự)
3. Mở file APK và cài đặt

### Cách 2: Cài đặt trực tiếp qua ADB

```bash
adb install FE/FE-User/android/app/build/outputs/apk/release/app-release.apk
```

### Cách 3: Cài đặt qua USB Debugging

1. Bật USB Debugging trên điện thoại (Settings → Developer Options)
2. Kết nối điện thoại với máy tính qua USB
3. Chạy lệnh:
```bash
adb install FE/FE-User/android/app/build/outputs/apk/release/app-release.apk
```

## Lưu Ý Quan Trọng

⚠️ **Hiện tại ứng dụng đang sử dụng debug keystore cho release build.**

Để phát hành chính thức lên Google Play Store, bạn cần:

1. **Tạo release keystore:**
```bash
cd FE/FE-User/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. **Cấu hình release signing trong `android/app/build.gradle`**

3. **Bảo vệ thông tin keystore** - KHÔNG commit keystore và passwords vào Git

## Clean Build (Nếu gặp lỗi)

```bash
npm run clean:android
npm run build:android:release
```

## Build Android App Bundle (AAB) cho Google Play

```bash
npm run build:android:bundle
```

File AAB sẽ ở: `android/app/build/outputs/bundle/release/app-release.aab`

