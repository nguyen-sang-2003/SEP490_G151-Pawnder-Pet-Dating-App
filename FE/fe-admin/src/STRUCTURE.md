# Cấu trúc thư mục FE-Admin

## Tổng quan

Dự án được tổ chức theo **Feature-Based Architecture** với các thư mục chính. Tất cả file `.js` và `.css` được tách riêng, CSS được đặt trong folder `styles/` của mỗi feature/component.

## Cấu trúc thư mục chi tiết

```
src/
├── index.js                    # Entry point - ReactDOM render
├── index.css                   # Global CSS styles
├── logo.svg                    # Logo của ứng dụng
├── reportWebVitals.js          # Web vitals reporting
├── setupTests.js               # Test setup configuration
│
├── config/                     # Cấu hình ứng dụng
│   ├── App.js                  # Main App component với routing
│   ├── App.test.js             # Unit tests cho App component
│   └── styles/                 # Styles cho App component
│       └── App.css             # Global app styles (reset, theme, base styles)
│
├── assets/                     # Tài nguyên tĩnh
│   ├── icons/                  # Icon files
│   └── images/                 # Image files
│
├── components/                 # Components có thể tái sử dụng
│   ├── common/                 # Components chung
│   │   ├── Header.js           # Header component
│   │   ├── Sidebar.js          # Sidebar cho Admin
│   │   ├── ExpertSidebar.js    # Sidebar cho Expert
│   │   ├── ProtectedRoute.js   # Route protection component
│   │   └── styles/             # Styles cho common components
│   │       ├── Header.css
│   │       └── Sidebar.css
│   │
│   ├── layout/                 # Layout components
│   │   ├── AdminLayout.js      # Layout cho Admin pages
│   │   ├── ExpertLayout.js     # Layout cho Expert pages
│   │   └── styles/             # Styles cho layout components
│   │       └── AdminLayout.css
│   │
│   ├── forms/                  # Form components (trống - có thể thêm sau)
│   ├── ui/                     # Basic UI components (trống - có thể thêm sau)
│   └── index.js                # Export tất cả components
│
├── features/                   # Feature modules (mỗi feature độc lập)
│   │
│   ├── auth/                   # Feature: Xác thực người dùng
│   │   ├── Login.js            # Component đăng nhập
│   │   ├── index.js            # Export feature components
│   │   └── styles/             # Styles cho auth feature
│   │       └── Login.css
│   │
│   ├── dashboard/              # Feature: Dashboard tổng quan
│   │   ├── Dashboard.js        # Component dashboard
│   │   ├── index.js            # Export feature components
│   │   └── styles/             # Styles cho dashboard feature
│   │       └── Dashboard.css
│   │
│   ├── users/                  # Feature: Quản lý người dùng
│   │   ├── UsersList.js        # Danh sách người dùng
│   │   ├── UserDetail.js       # Chi tiết người dùng
│   │   ├── index.js            # Export feature components
│   │   └── styles/             # Styles cho users feature
│   │       ├── UsersList.css
│   │       └── UserDetail.css
│   │
│   ├── pets/                   # Feature: Quản lý thú cưng
│   │   ├── PetsList.js         # Danh sách thú cưng
│   │   ├── PetDetail.js        # Chi tiết thú cưng
│   │   ├── Activities.js       # Hoạt động thú cưng
│   │   ├── index.js            # Export feature components
│   │   └── styles/             # Styles cho pets feature
│   │       ├── PetsList.css
│   │       ├── PetDetail.css
│   │       └── Activities.css
│   │
│   ├── reports/                # Feature: Quản lý báo cáo
│   │   ├── ReportsList.js      # Danh sách báo cáo
│   │   ├── ReportDetail.js     # Chi tiết báo cáo
│   │   ├── index.js            # Export feature components
│   │   └── styles/             # Styles cho reports feature
│   │       ├── ReportsList.css
│   │       └── ReportDetail.css
│   │
│   ├── experts/                # Feature: Quản lý chuyên gia
│   │   ├── ExpertList.js       # Danh sách chuyên gia
│   │   ├── ExpertDetail.js     # Chi tiết chuyên gia
│   │   ├── CreateExpert.js     # Tạo chuyên gia mới
│   │   ├── ExpertChat.js       # Chat với người dùng
│   │   ├── ExpertNotifications.js  # Thông báo chờ xác nhận
│   │   ├── index.js            # Export feature components
│   │   └── styles/             # Styles cho experts feature
│   │       ├── ExpertList.css
│   │       ├── ExpertDetail.css
│   │       ├── CreateExpert.css
│   │       ├── ExpertChat.css
│   │       └── ExpertNotifications.css
│   │
│   ├── payments/               # Feature: Quản lý thanh toán
│   │   ├── PaymentManagement.js # Quản lý thanh toán
│   │   ├── index.js            # Export feature components
│   │   └── styles/             # Styles cho payments feature
│   │       └── PaymentManagement.css
│   │
│   └── attributes/             # Feature: Quản lý thuộc tính
│       ├── AttributeManagement.js  # Quản lý thuộc tính
│       ├── index.js            # Export feature components
│       └── styles/              # Styles cho attributes feature
│           └── AttributeManagement.css
│
└── shared/                     # Code dùng chung giữa các features
    │
    ├── api/                     # API services
    │   ├── apiClient.js         # Axios instance với interceptors
    │   ├── authService.js       # Service xác thực
    │   ├── userService.js       # Service quản lý người dùng
    │   ├── petService.js        # Service quản lý thú cưng
    │   ├── petPhotoService.js   # Service quản lý ảnh thú cưng
    │   ├── reportService.js     # Service quản lý báo cáo
    │   ├── notificationService.js  # Service thông báo
    │   ├── expertService.js     # Service quản lý chuyên gia
    │   ├── dashboardService.js  # Service dashboard
    │   ├── chatExpertService.js # Service chat với chuyên gia
    │   ├── attributeService.js  # Service quản lý thuộc tính
    │   ├── paymentService.js    # Service quản lý thanh toán
    │   └── index.js             # Export tất cả API services
    │
    ├── constants/               # Constants và cấu hình
    │   └── index.js             # Tất cả constants (API endpoints, roles, status, etc.)
    │
    ├── context/                 # React Contexts
    │   ├── AuthContext.js       # Context xác thực người dùng
    │   ├── ThemeContext.js      # Context quản lý theme (light/dark)
    │   ├── NotificationContext.js  # Context quản lý thông báo
    │   ├── SignalRContext.js    # Context cho SignalR real-time
    │   └── index.js             # Export tất cả contexts
    │
    ├── hooks/                   # Custom React hooks
    │   └── index.js             # Export tất cả hooks (useApi, useLocalStorage, useDebounce, usePagination)
    │
    ├── utils/                   # Utility functions
    │   ├── formatDate.js        # Format ngày tháng
    │   ├── formatCurrency.js    # Format tiền tệ
    │   ├── validateEmail.js     # Validate email
    │   ├── jwtUtils.js          # JWT token utilities
    │   ├── storage.js           # Local storage utilities
    │   ├── debounce.js          # Debounce function
    │   ├── constants.js         # Utility constants
    │   └── index.js             # Export tất cả utilities
    │
    ├── types/                   # TypeScript type definitions
    │   └── index.ts             # Interface và type definitions
    │
    └── data/                    # Mock data (dùng cho development/testing)
        ├── mockUsers.js         # Mock data người dùng
        ├── mockPets.js          # Mock data thú cưng
        ├── mockReports.js       # Mock data báo cáo
        ├── mockPayments.js      # Mock data thanh toán
        └── mockUserNotifications.js  # Mock data thông báo
```

## Nguyên tắc tổ chức

### 1. Features (Feature-Based Architecture)
- **Mục đích**: Mỗi feature là một module độc lập, tự chứa
- **Cấu trúc**: Mỗi feature có:
  - File `.js` chứa logic và component
  - Folder `styles/` chứa file `.css` tương ứng
  - File `index.js` để export các components của feature
- **Lợi ích**: Dễ tìm, dễ bảo trì, dễ mở rộng

### 2. Shared (Infrastructure Layer)
- **Mục đích**: Code được dùng chung giữa nhiều features
- **Bao gồm**:
  - `api/`: Tất cả API services
  - `constants/`: Constants và cấu hình
  - `context/`: React contexts cho global state
  - `hooks/`: Custom hooks có thể tái sử dụng
  - `utils/`: Utility functions
  - `types/`: TypeScript type definitions
  - `data/`: Mock data cho development/testing

### 3. Components (UI Layer)
- **Mục đích**: Components có thể tái sử dụng trên toàn app
- **Phân loại**:
  - `common/`: Components chung (Header, Sidebar, ProtectedRoute)
  - `layout/`: Layout components (AdminLayout, ExpertLayout)
  - `forms/`: Form components (nếu có)
  - `ui/`: Basic UI components (nếu có)
- **Cấu trúc**: Tương tự features, mỗi component có folder `styles/` riêng

### 4. Config (Application Layer)
- **Mục đích**: Cấu hình app-level
- **Bao gồm**:
  - `App.js`: Main App component với routing
  - `App.test.js`: Unit tests
  - `styles/App.css`: Global app styles

## Quy tắc tổ chức Styles

### Tách riêng JS và CSS
- **File `.js`**: Đặt ở root của feature/component
- **File `.css`**: Đặt trong folder `styles/` của feature/component
- **Import path**: `import './styles/ComponentName.css'`

### Ví dụ cấu trúc:
```
features/auth/
├── Login.js              # Component logic
├── index.js              # Exports
└── styles/
    └── Login.css         # Styles cho Login component
```

## Import Paths

### Import từ features:
```javascript
// Import từ feature auth
import { Login } from '../features/auth';

// Import từ feature dashboard
import { Dashboard } from '../features/dashboard';

// Import nhiều components từ cùng feature
import { UsersList, UserDetail } from '../features/users';
```

### Import từ shared:
```javascript
// Import API services
import { userService, petService } from '../shared/api';

// Import contexts
import { useAuth } from '../shared/context';
import { useTheme } from '../shared/context/ThemeContext';

// Import utilities
import { formatDate, formatCurrency } from '../shared/utils';

// Import constants
import { USER_ROLES, STORAGE_KEYS } from '../shared/constants';
```

### Import từ components:
```javascript
// Import layout components
import AdminLayout from '../components/layout/AdminLayout';
import ExpertLayout from '../components/layout/ExpertLayout';

// Import common components
import ProtectedRoute from '../components/common/ProtectedRoute';
import Header from '../components/common/Header';
```

### Import styles:
```javascript
// Import styles trong cùng feature/component
import './styles/ComponentName.css';

// Ví dụ trong Login.js
import './styles/Login.css';
```

## Lợi ích của cấu trúc này

1. **Dễ bảo trì**: 
   - Mỗi feature độc lập, dễ tìm và sửa
   - JS và CSS tách riêng, dễ quản lý

2. **Scalable**: 
   - Dễ thêm features mới
   - Không ảnh hưởng đến features khác

3. **Reusable**: 
   - Shared code được tổ chức rõ ràng
   - Components có thể tái sử dụng

4. **Dễ vẽ package diagram**: 
   - Cấu trúc rõ ràng, layers tách biệt
   - Dependencies dễ visualize

5. **Team collaboration**: 
   - Nhiều người có thể làm việc trên các features khác nhau
   - Ít conflict khi merge code

6. **Code organization**: 
   - JS và CSS tách riêng, dễ đọc
   - Styles được tổ chức theo feature/component

## Dependency Rules (Quy tắc phụ thuộc)

### ✅ Được phép:
- Features → shared/*
- Features → components/*
- Components → shared/*
- Config → features/*
- Config → components/*
- Config → shared/*

### ❌ Không được phép:
- Features → features/* (không có cross-feature dependencies)
- Shared → features/* (shared phải độc lập)
- Shared → components/* (shared phải độc lập)

## Migration Notes (Ghi chú di chuyển)

Các thay đổi đã thực hiện:
- ✅ Các pages cũ đã được di chuyển vào `features/`
- ✅ Services đã được di chuyển vào `shared/api/`
- ✅ Contexts đã được di chuyển vào `shared/context/`
- ✅ Utils đã được di chuyển vào `shared/utils/`
- ✅ Constants đã được di chuyển vào `shared/constants/`
- ✅ Hooks đã được di chuyển vào `shared/hooks/`
- ✅ Styles đã được tách riêng vào folder `styles/` trong mỗi feature/component
- ✅ File `App.js` đã được di chuyển vào `config/`
- ✅ Folder `pages/` cũ đã được xóa
- ✅ File `App.css` ở root đã được xóa (đã có trong `config/styles/`)

## Best Practices (Thực hành tốt)

1. **Naming Conventions**:
   - Components: PascalCase (Login.js, UserDetail.js)
   - Files: camelCase (userService.js, formatDate.js)
   - Constants: UPPER_SNAKE_CASE (USER_ROLES, API_BASE_URL)

2. **File Organization**:
   - Mỗi component có file riêng
   - Styles trong folder `styles/` riêng
   - Export qua `index.js` để import dễ dàng

3. **Import Paths**:
   - Luôn dùng relative paths
   - Import từ `index.js` khi có thể
   - Tránh import trực tiếp từ file con

4. **Code Structure**:
   - Import statements ở đầu file
   - Component definition
   - Export ở cuối file (hoặc dùng named export)
