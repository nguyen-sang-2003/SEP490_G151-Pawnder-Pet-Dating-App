import {configureStore} from '@reduxjs/toolkit';
import badgeReducer from '../features/badge/badgeSlice';
import appointmentReducer from '../features/appointment/appointmentSlice';
import eventReducer from '../features/event/eventSlice';

// Import your reducers here
// import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    // Add your reducers here
    // auth: authReducer,
    badge: badgeReducer,
    appointment: appointmentReducer,
    event: eventReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['your/action/type'],
      },
      // Tắt immutability check để tránh warning về performance
      immutableCheck: false,
    }),
  // Chỉ bật DevTools trong development
  devTools: __DEV__,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

