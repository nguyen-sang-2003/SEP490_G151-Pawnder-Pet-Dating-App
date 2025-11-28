// Auth pages
export { default as Login } from './auth/Login';
export { default as ForgotPassword } from './auth/ForgotPassword';

// Dashboard
export { default as Dashboard } from './dashboard/Dashboard';

// User management
export { default as UsersList } from './users/UsersList';
export { default as UserDetail } from './users/UserDetail';
export { default as UserCreate } from './users/UserCreate';
export { default as UserEdit } from './users/UserEdit';

// Pet management
export { default as PetsList } from './activities/pets/PetsList';
export { default as PetDetail } from './activities/pets/PetDetail';
// NOTE: PetCreate/PetEdit components now live under activities/pets if/when reintroduced

// Reports
export { default as ReportsList } from './reports/ReportsList';
export { default as ReportDetail } from './reports/ReportDetail';
