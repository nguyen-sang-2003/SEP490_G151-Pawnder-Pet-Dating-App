# Kiểm tra API Endpoints - Backend vs Frontend

## ✅ CÁC ENDPOINTS KHỚP 100%

### 1. AuthController
- ✅ POST `/api/login`
- ✅ POST `/api/logout`

### 2. UserController
- ✅ GET `/user?search=&roleId=&statusId=&page=1&pageSize=20`
- ✅ GET `/user/{userId}`
- ✅ POST `/user`
- ✅ PUT `/user/{userId}`
- ✅ DELETE `/user/{userId}`

### 3. AdminsController
- ✅ PUT `/admin/users/{id}`
- ✅ POST `/admin/users`

### 4. PetController
- ✅ GET `/api/pet/user/{userId}`
- ✅ GET `/api/pet/{petId}`
- ✅ POST `/api/pet`
- ✅ PUT `/api/pet/{petId}`
- ✅ DELETE `/api/pet/{petId}`

### 5. PetPhotoController
- ✅ GET `/api/pet-photo/{petId}`
- ✅ POST `/api/pet-photo` (FormData: petId, files[])
- ✅ PUT `/api/pet-photo/{photoId}/primary`
- ✅ PUT `/api/pet-photo/reorder`
- ✅ DELETE `/api/pet-photo/{photoId}?hard=false`

### 6. NotificationController
- ✅ GET `/api/notification`
- ✅ GET `/api/notification/{notificationId}`
- ✅ GET `/api/notification/user/{userId}`
- ✅ POST `/api/notification`
- ✅ DELETE `/api/notification/{notificationId}`

### 7. ReportController
- ✅ GET `/report`
- ✅ GET `/report/{reportId}`
- ✅ GET `/report/user/{userReportId}`
- ✅ POST `/report/{userReportId}/{contentId}`
- ✅ PUT `/report/{reportId}`

## ⚠️ VẤN ĐỀ PHÁT HIỆN

### 1. ExpertController - GET Detail Endpoint
**Backend:**
```csharp
[HttpGet("expert-confirmation/{userId:int}/{chatId:int}")]
public async Task<ActionResult<ExpertConfirmationDTO>> GetExpertConfirmation(
    int expertId, int userId, int chatId)  // ❌ expertId không có trong route!
```

**Vấn đề:**
- Route chỉ có `{userId}` và `{chatId}`, nhưng method có 3 parameters: `expertId`, `userId`, `chatId`
- Parameter `expertId` không được bind từ route → sẽ = 0 (default)
- Backend sẽ không tìm được confirmation vì `expertId = 0`

**Frontend hiện tại:**
```javascript
DETAIL: (userId, chatId) => `/expert-confirmation/${userId}/${chatId}`
```

**Giải pháp:**
- Option 1: Backend cần sửa route thành: `expert-confirmation/{expertId:int}/{userId:int}/{chatId:int}`
- Option 2: Backend cần lấy `expertId` từ JWT token (từ user đang đăng nhập)
- Option 3: Frontend cần update để gửi `expertId` trong query string hoặc body

### 2. ExpertController - PUT Update Endpoint
**Backend:**
```csharp
[HttpPut("expert-confirmation/{confirmationId:int}/{userId:int}/{chatId:int}")]
public async Task<ActionResult<ExpertConfirmationResponseDTO>> UpdateExpertConfirmation(
    int confirmationId, int userId, int chatId,  // ❌ Thứ tự parameters không rõ ràng
    [FromBody] ExpertConfirmationUpdateDto dto)
```

**Vấn đề:**
- Route có 3 parameters: `confirmationId`, `userId`, `chatId`
- Method signature có thứ tự: `confirmationId`, `userId`, `chatId` - nhưng comment nói `confirmationId` là `expertId`
- Logic trong method: `ec.ExpertId == confirmationId` → Route parameter đầu tiên là `ExpertId`, không phải `confirmationId`

**Frontend hiện tại:**
```javascript
UPDATE: (confirmationId, userId, chatId) => `/expert-confirmation/${confirmationId}/${userId}/${chatId}`
```

**Giải pháp:**
- Backend cần clarify: Route parameter đầu tiên là `expertId` hay `confirmationId`?
- Nếu là `expertId`: Route nên là `expert-confirmation/{expertId:int}/{userId:int}/{chatId:int}`
- Frontend cần update để match với backend

## 📝 KẾT LUẬN

**Khớp 100%:** 7/8 controllers (87.5%)
**Có vấn đề:** 1/8 controllers (ExpertController) - 12.5%

**Khuyến nghị:**
1. ✅ Các endpoints khác đã khớp 100%
2. ⚠️ Cần fix ExpertController endpoints để khớp với frontend
3. ✅ Frontend đã cấu hình đúng cho các endpoints đã khớp

## 🔧 CẦN SỬA

### ExpertController - GET Detail
**Hiện tại (Backend):**
```csharp
[HttpGet("expert-confirmation/{userId:int}/{chatId:int}")]
public async Task<ActionResult<ExpertConfirmationDTO>> GetExpertConfirmation(
    int expertId, int userId, int chatId)
```

**Nên sửa thành (Option 1 - Lấy expertId từ JWT):**
```csharp
[HttpGet("expert-confirmation/{userId:int}/{chatId:int}")]
[Authorize]
public async Task<ActionResult<ExpertConfirmationDTO>> GetExpertConfirmation(
    int userId, int chatId)
{
    // Lấy expertId từ JWT token
    var expertId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
    // ...
}
```

**Hoặc (Option 2 - Thêm expertId vào route):**
```csharp
[HttpGet("expert-confirmation/{expertId:int}/{userId:int}/{chatId:int}")]
public async Task<ActionResult<ExpertConfirmationDTO>> GetExpertConfirmation(
    int expertId, int userId, int chatId)
```

**Nếu chọn Option 2, Frontend cần update:**
```javascript
DETAIL: (expertId, userId, chatId) => `/expert-confirmation/${expertId}/${userId}/${chatId}`
```

### ExpertController - PUT Update
**Hiện tại (Backend):**
- Route: `expert-confirmation/{confirmationId:int}/{userId:int}/{chatId:int}`
- Logic: `ec.ExpertId == confirmationId` → Route parameter đầu tiên là `ExpertId`

**Nên sửa route thành:**
```csharp
[HttpPut("expert-confirmation/{expertId:int}/{userId:int}/{chatId:int}")]
```

**Frontend đã đúng:**
```javascript
UPDATE: (confirmationId, userId, chatId) => `/expert-confirmation/${confirmationId}/${userId}/${chatId}`
```
→ Chỉ cần rename parameter trong frontend từ `confirmationId` → `expertId` để rõ ràng hơn

