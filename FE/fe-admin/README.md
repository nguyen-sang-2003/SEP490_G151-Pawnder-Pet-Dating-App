# Pawnder Admin Panel

Ứng dụng quản trị cho Pawnder - Pet Dating App

## Cấu trúc Folder

```
src/
├── components/           # Các component tái sử dụng
│   ├── common/          # Component chung (Header, Sidebar, Footer, Loading, ErrorBoundary)
│   ├── layout/          # Component layout (Layout, AdminLayout)
│   ├── forms/           # Component form (FormInput, FormSelect, FormTextarea, FormButton)
│   ├── ui/              # Component UI cơ bản (Button, Modal, Table, Card, Badge)
│   └── index.js         # Export tất cả components
│
├── pages/               # Các trang của ứng dụng
│   ├── auth/            # Trang xác thực (Login, ForgotPassword)
│   ├── dashboard/       # Trang dashboard
│   ├── users/           # Quản lý người dùng (UsersList, UserDetail, UserCreate, UserEdit)
│   ├── pets/            # Quản lý thú cưng (PetsList, PetDetail, PetCreate, PetEdit)
│   ├── reports/         # Quản lý báo cáo (ReportsList, ReportDetail)
│   └── index.js         # Export tất cả pages
│
├── services/            # Các service API
│   ├── api/             # API services (apiClient, userService, petService, reportService)
│   ├── auth/            # Authentication service
│   └── index.js         # Export tất cả services
│
├── context/             # React Context cho state management
│   ├── AuthContext.js   # Context cho authentication
│   ├── ThemeContext.js  # Context cho theme
│   └── index.js         # Export tất cả contexts
│
├── hooks/               # Custom hooks
│   └── index.js         # Export tất cả hooks (useApi, useLocalStorage, useDebounce, usePagination)
│
├── utils/               # Utility functions
│   ├── formatDate.js    # Format date utilities
│   ├── formatCurrency.js # Format currency utilities
│   ├── validateEmail.js # Validation utilities
│   ├── debounce.js      # Debounce và throttle utilities
│   ├── storage.js       # Local storage utilities
│   ├── constants.js     # Constants cho utilities
│   └── index.js         # Export tất cả utilities
│
├── constants/           # Constants của ứng dụng
│   └── index.js         # API endpoints, user roles, pet status, etc.
│
├── types/               # TypeScript type definitions
│   └── index.ts         # Interface và type definitions
│
├── assets/              # Static assets
│   ├── images/          # Images
│   └── icons/           # Icons
│
├── styles/              # CSS modules và global styles
│
├── App.js               # Main App component
├── App.css              # Global styles
└── index.js             # Entry point
```

## Cài đặt Dependencies

```bash
npm install
```

## Chạy ứng dụng

```bash
npm start
```

## Các tính năng chính

### 1. Authentication
- Login/Logout
- Protected routes
- Token management

### 2. User Management
- Danh sách người dùng
- Chi tiết người dùng
- Ban/Unban user
- Quản lý role

### 3. Pet Management
- Danh sách thú cưng
- Chi tiết thú cưng
- Approve/Reject pet
- Upload photos

### 4. Report Management
- Danh sách báo cáo
- Chi tiết báo cáo
- Resolve/Reject reports
- Statistics

### 5. Dashboard
- Thống kê tổng quan
- Charts và graphs
- Quick actions

## Cấu hình

### Environment Variables
Tạo file `.env` trong thư mục gốc:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=Pawnder Admin
```

### API Configuration
Cấu hình API endpoints trong `src/constants/index.js`:

```javascript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

## Best Practices

### 1. Component Structure
- Mỗi component nên có file riêng
- Sử dụng functional components với hooks
- Props validation với PropTypes hoặc TypeScript

### 2. State Management
- Sử dụng Context API cho global state
- Local state với useState cho component state
- Custom hooks cho logic tái sử dụng

### 3. API Calls
- Sử dụng axios với interceptors
- Error handling tập trung
- Loading states

### 4. Styling
- CSS modules cho component-specific styles
- Global styles trong App.css
- Responsive design

### 5. File Organization
- Mỗi feature có folder riêng
- Index files để export
- Consistent naming conventions

## Development Guidelines

1. **Naming Conventions**
   - Components: PascalCase (UserList.js)
   - Files: camelCase (userService.js)
   - Constants: UPPER_SNAKE_CASE (API_BASE_URL)

2. **Code Structure**
   - Import statements ở đầu file
   - Component definition
   - Export ở cuối file

3. **Error Handling**
   - Try-catch cho async operations
   - Error boundaries cho components
   - User-friendly error messages

4. **Performance**
   - Lazy loading cho routes
   - Memoization cho expensive calculations
   - Debounce cho search inputs

## Troubleshooting

### Common Issues

1. **CORS Error**
   - Kiểm tra API server configuration
   - Đảm bảo API_URL đúng

2. **Authentication Issues**
   - Kiểm tra token storage
   - Verify API endpoints

3. **Build Errors**
   - Clear node_modules và reinstall
   - Check for syntax errors

## Contributing

1. Follow coding standards
2. Write meaningful commit messages
3. Test your changes
4. Update documentation if needed