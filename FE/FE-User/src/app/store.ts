import {configureStore} from '@reduxjs/toolkit';
import badgeReducer from '../features/badge/badgeSlice';
import appointmentReducer from '../features/appointment/appointmentSlice';

// Import your reducers here
// import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    // Add your reducers here
    // auth: authReducer,
    badge: badgeReducer,
    appointment: appointmentReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['your/action/type'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

