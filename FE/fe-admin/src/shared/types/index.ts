// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'user';
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
  updatedAt: string;
}

// Pet Types
export interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: number;
  gender: 'male' | 'female';
  description: string;
  photos: string[];
  ownerId: number;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Report Types
export interface Report {
  id: number;
  reporterId: number;
  reportedUserId?: number;
  reportedPetId?: number;
  reason: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface UserForm {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
}

export interface PetForm {
  name: string;
  species: string;
  breed: string;
  age: number;
  gender: string;
  description: string;
  photos: File[];
}

// Component Props Types
export interface TableColumn {
  key: string;
  title: string;
  dataIndex: string;
  render?: (value: any, record: any) => React.ReactNode;
  sorter?: boolean;
  width?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Context Types
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginForm) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
