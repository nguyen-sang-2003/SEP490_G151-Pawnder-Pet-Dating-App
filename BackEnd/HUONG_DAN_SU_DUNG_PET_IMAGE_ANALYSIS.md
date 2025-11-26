# 🐾 HƯỚNG DẪN SỬ DỤNG API PHÂN TÍCH ẢNH THÚ CƯNG

API này sử dụng Google Gemini Vision AI để tự động phân tích ảnh thú cưng và trả về các đặc điểm như: màu lông, cân nặng, giới tính, hình dạng tai, mõm, v.v.

---

## 📋 MỤC LỤC
1. [Cấu hình](#1-cấu-hình)
2. [Các API Endpoints](#2-các-api-endpoints)
3. [Cách test với Swagger](#3-cách-test-với-swagger)
4. [Cách test với Postman](#4-cách-test-với-postman)
5. [Ví dụ Response](#5-ví-dụ-response)
6. [Tích hợp vào React Native](#6-tích-hợp-vào-react-native)

---

## 1. CẤU HÌNH

### Kiểm tra `appsettings.json`:
```json
{
  "GeminiAPI": {
    "ApiKey": "AIzaSyAf2MmqeAwHQxsFSkMos0VKxhDvlzPBrMg"
  }
}
```

✅ API Key đã được cấu hình sẵn, không cần thay đổi gì!

---

## 2. CÁC API ENDPOINTS

### 🔹 API 1: Phân tích ảnh (chỉ trả về data)
**Endpoint:** `POST /api/PetImageAnalysis/analyze`

**Mô tả:** Upload ảnh thú cưng → AI phân tích → Trả về danh sách thuộc tính

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form-data với key `image` (file ảnh)

**Chấp nhận:**
- Định dạng: JPG, PNG, WEBP
- Kích thước tối đa: 10MB

---

### 🔹 API 2: Phân tích và lưu vào database
**Endpoint:** `POST /api/PetImageAnalysis/analyze-and-save/{petId}`

**Mô tả:** Upload ảnh → AI phân tích → Tự động lưu vào bảng `PetCharacteristic`

**Parameters:**
- `petId` (path): ID của thú cưng cần cập nhật
- `image` (form-data): File ảnh

---

## 3. CÁCH TEST VỚI SWAGGER

### Bước 1: Chạy ứng dụng
```bash
cd BE/BE
dotnet run
```

### Bước 2: Mở Swagger
Truy cập: `https://localhost:7238/swagger`

### Bước 3: Test API
1. Tìm endpoint `POST /api/PetImageAnalysis/analyze`
2. Click **"Try it out"**
3. Click **"Choose File"** và chọn ảnh thú cưng
4. Click **"Execute"**

### Bước 4: Xem kết quả
Response sẽ hiển thị dưới phần **Response body**

---

## 4. CÁCH TEST VỚI POSTMAN

### Bước 1: Tạo request mới
- Method: `POST`
- URL: `https://localhost:7238/api/PetImageAnalysis/analyze`

### Bước 2: Cấu hình Body
1. Chọn tab **"Body"**
2. Chọn **"form-data"**
3. Thêm key:
   - Key: `image`
   - Type: **File** (dropdown bên phải)
   - Value: Click **"Select Files"** và chọn ảnh

### Bước 3: Gửi request
Click **"Send"**

---

## 5. VÍ DỤ RESPONSE

### ✅ Response thành công:
```json
{
  "success": true,
  "message": "Phân tích ảnh thành công",
  "attributes": [
    {
      "attributeName": "Hình dạng đầu",
      "optionName": "Tròn",
      "value": null,
      "attributeId": 1,
      "optionId": 1
    },
    {
      "attributeName": "Màu lông",
      "optionName": "Vàng",
      "value": null,
      "attributeId": 3,
      "optionId": 12
    },
    {
      "attributeName": "Cân nặng",
      "optionName": null,
      "value": 25,
      "attributeId": 6,
      "optionId": null
    },
    {
      "attributeName": "Giới tính",
      "optionName": "Đực",
      "value": null,
      "attributeId": 15,
      "optionId": 67
    },
    {
      "attributeName": "Kích thước mắt",
      "optionName": "To",
      "value": null,
      "attributeId": 7,
      "optionId": 30
    }
  ],
  "sqlInsertScript": null
}
```

### ❌ Response lỗi:
```json
{
  "success": false,
  "message": "Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP",
  "attributes": null,
  "sqlInsertScript": null
}
```

---

## 6. TÍCH HỢP VÀO REACT NATIVE

### Cài đặt dependencies:
```bash
npm install react-native-image-picker
```

### Code mẫu:
```typescript
import { launchImageLibrary } from 'react-native-image-picker';

const analyzePetImage = async () => {
  // Chọn ảnh từ thư viện
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.8,
  });

  if (result.assets && result.assets[0]) {
    const photo = result.assets[0];
    
    // Tạo FormData
    const formData = new FormData();
    formData.append('image', {
      uri: photo.uri,
      type: photo.type || 'image/jpeg',
      name: photo.fileName || 'pet.jpg',
    });

    try {
      // Gọi API
      const response = await fetch(
        'https://your-api.com/api/PetImageAnalysis/analyze',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log('Attributes:', data.attributes);
        // Xử lý dữ liệu attributes
        data.attributes.forEach(attr => {
          console.log(`${attr.attributeName}: ${attr.optionName || attr.value}`);
        });
      } else {
        console.error('Error:', data.message);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  }
};
```

### Sử dụng với Pet ID (lưu trực tiếp):
```typescript
const analyzePetImageAndSave = async (petId: number) => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.8,
  });

  if (result.assets && result.assets[0]) {
    const photo = result.assets[0];
    const formData = new FormData();
    
    formData.append('image', {
      uri: photo.uri,
      type: photo.type || 'image/jpeg',
      name: photo.fileName || 'pet.jpg',
    });

    try {
      const response = await fetch(
        `https://your-api.com/api/PetImageAnalysis/analyze-and-save/${petId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      );

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Thành công', 'Đã phân tích và lưu thông tin thú cưng!');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
};
```

---

## 📌 LƯU Ý

### ✅ Những gì AI có thể phân tích:
- ✔ Hình dạng đầu (Tròn, Dài, Vuông, Cân đối)
- ✔ Màu lông (Trắng, Vàng, Nâu, Đen, Xám, Đỏ, Bạc, Xanh, Đốm)
- ✔ Độ dài lông (Ngắn, Trung bình, Dài)
- ✔ Kiểu lông (Mượt, Xoăn, Xù, Không lông)
- ✔ Cân nặng (ước tính, đơn vị kg)
- ✔ Chiều cao (ước tính, đơn vị cm)
- ✔ Giới tính (Đực, Cái)
- ✔ Kích thước mắt (Rất to, To, Trung bình, Nhỏ)
- ✔ Màu mắt (Đen, Nâu, Vàng, Xanh dương, Xanh lá, Hổ phách)
- ✔ Hình dạng tai (Dựng, Cụp, Dài, Ngắn, Tròn)
- ✔ Hình dạng đuôi (Thẳng, Cong, Dài, Cụt)
- ✔ Tỷ lệ chân-thân
- ✔ Trạng thái cơ thể (Gầy, Săn chắc, Cân đối, Mũm mĩm, Béo)

### ⚠️ Hạn chế:
- AI có thể không chính xác 100%, đặc biệt với:
  - Ảnh mờ, tối, góc chụp không đẹp
  - Cân nặng, chiều cao (chỉ ước lượng)
- Nên cho người dùng xác nhận/chỉnh sửa sau khi AI phân tích

### 🔧 Troubleshooting:

**Lỗi 500 Internal Server Error:**
- Kiểm tra Gemini API Key còn hoạt động
- Kiểm tra kết nối internet của server
- Xem logs trong console để biết chi tiết

**Lỗi 400 Bad Request:**
- Kiểm tra định dạng file (chỉ JPG, PNG, WEBP)
- Kiểm tra kích thước file (< 10MB)
- Đảm bảo key trong form-data là `image`

---

## 🎯 WORKFLOW ĐỀ XUẤT

### Khi tạo Pet mới:
1. Người dùng upload ảnh thú cưng
2. Gọi API `analyze` để lấy thông tin
3. Hiển thị các thuộc tính AI phân tích được
4. Cho phép người dùng chỉnh sửa nếu cần
5. Lưu Pet cùng với PetCharacteristic

### Khi cập nhật Pet:
1. Người dùng upload ảnh mới
2. Gọi API `analyze-and-save/{petId}`
3. Tự động cập nhật PetCharacteristic
4. Thông báo thành công

---

🎉 **Chúc bạn sử dụng thành công!**

Nếu có thắc mắc, hãy kiểm tra logs trong console hoặc response message từ API.
