import {configureStore} from '@reduxjs/toolkit';

// Import your reducers here
// import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    // Add your reducers here
    // auth: authReducer,
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

