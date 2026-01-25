/**
 * Appointment Redux Slice
 * Manages appointment state and async actions
 */

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import {
  AppointmentResponse,
  CreateAppointmentRequest,
  RespondAppointmentRequest,
  CounterOfferRequest,
  CancelAppointmentRequest,
  CheckInRequest,
  LocationResponse,
  CreateLocationRequest,
  AppointmentStatus,
} from '../../types/appointment.types';
import { LocationSelectionResult } from '../../types/location.types';
import { AppointmentService } from '../../services/appointment.service';

// ============================================
// STATE INTERFACE
// ============================================

interface AppointmentState {
  // Data
  appointments: AppointmentResponse[];
  currentAppointment: AppointmentResponse | null;
  locations: LocationResponse[];
  selectedLocation: LocationSelectionResult | null;
  
  // Loading states
  loading: boolean;
  locationsLoading: boolean;
  
  // Action-specific loading states
  creating: boolean;
  responding: boolean;
  cancelling: boolean;
  checkingIn: boolean;
  counterOffering: boolean;
  completing: boolean;
  
  // Error handling
  error: string | null;
  
  // Validation
  validationError: string | null;
  validationChecked: boolean;
}

const initialState: AppointmentState = {
  appointments: [],
  currentAppointment: null,
  locations: [],
  selectedLocation: null,
  loading: false,
  locationsLoading: false,
  creating: false,
  responding: false,
  cancelling: false,
  checkingIn: false,
  counterOffering: false,
  completing: false,
  error: null,
  validationError: null,
  validationChecked: false,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Validate preconditions before creating appointment
 */
export const validatePreconditions = createAsyncThunk(
  'appointment/validatePreconditions',
  async (params: { matchId: number; inviterPetId: number; inviteePetId: number }, { rejectWithValue }) => {
    try {
      const response = await AppointmentService.validatePreconditions(
        params.matchId,
        params.inviterPetId,
        params.inviteePetId
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Validation failed');
    }
  }
);

/**
 * Create new appointment
 */
export const createAppointment = createAsyncThunk(
  'appointment/create',
  async (request: CreateAppointmentRequest, { rejectWithValue }) => {
    try {
      const response = await AppointmentService.createAppointment(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create appointment');
    }
  }
);

/**
 * Get appointment by ID
 */
export const fetchAppointmentById = createAsyncThunk(
  'appointment/fetchById',
  async (appointmentId: number, { rejectWithValue }) => {
    try {
      const response = await AppointmentService.getAppointmentById(appointmentId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch appointment');
    }
  }
);

/**
 * Get appointments by match
 */
export const fetchAppointmentsByMatch = createAsyncThunk(
  'appointment/fetchByMatch',
  async (matchId: number, { rejectWithValue }) => {
    try {
      const response = await AppointmentService.getAppointmentsByMatch(matchId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch appointments');
    }
  }
);

/**
 * Get all my appointments
 */
export const fetchMyAppointments = createAsyncThunk(
  'appointment/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await AppointmentService.getMyAppointments();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch appointments');
    }
  }
);

/**
 * Respond to appointment (Accept/Decline)
 */
export const respondToAppointment = createAsyncThunk(
  'appointment/respond',
  async (params: { appointmentId: number; request: RespondAppointmentRequest }, { rejectWithValue }) => {
    try {
      const response = await AppointmentService.respondToAppointment(
        params.appointmentId,
        params.request
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to respond to appointment');
    }
  }
);

/**
 * Counter-offer appointment
 */
export const counterOfferAppointment = createAsyncThunk(
  'appointment/counterOffer',
  async (params: { appointmentId: number; request: CounterOfferRequest }, { rejectWithValue }) => {
    try {
      const response = await AppointmentService.counterOffer(
        params.appointmentId,
        params.request
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to counter-offer');
    }
  }
);

/**
 * Cancel appointment
 */
export const cancelAppointment = createAsyncThunk(
  'appointment/cancel',
  async (params: { appointmentId: number; request: CancelAppointmentRequest }, { rejectWithValue }) => {
    try {
      const response = await AppointmentService.cancelAppointment(
        params.appointmentId,
        params.request
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel appointment');
    }
  }
);

/**
 * Check-in to appointment
 */
export const checkInAppointment = createAsyncThunk(
  'appointment/checkIn',
  async (params: { appointmentId: number; request: CheckInRequest }, { rejectWithValue }) => {
    try {
      const response = await AppointmentService.checkIn(
        params.appointmentId,
        params.request
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check-in');
    }
  }
);

/**
 * Complete appointment (kết thúc cuộc hẹn)
 */
export const completeAppointment = createAsyncThunk(
  'appointment/complete',
  async (appointmentId: number, { rejectWithValue }) => {
    try {
      const response = await AppointmentService.completeAppointment(appointmentId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to complete appointment');
    }
  }
);

// ============================================
// SLICE
// ============================================

const appointmentSlice = createSlice({
  name: 'appointment',
  initialState,
  reducers: {
    // Clear current appointment
    clearCurrentAppointment: (state) => {
      state.currentAppointment = null;
    },
    
    // Clear errors
    clearError: (state) => {
      state.error = null;
      state.validationError = null;
    },
    
    // Clear validation
    clearValidation: (state) => {
      state.validationError = null;
      state.validationChecked = false;
    },
    
    // Reset state
    resetAppointmentState: (state) => {
      state.appointments = [];
      state.currentAppointment = null;
      state.locations = [];
      state.error = null;
      state.validationError = null;
      state.validationChecked = false;
    },
    
    // Update appointment in list (for real-time updates)
    updateAppointmentInList: (state, action: PayloadAction<AppointmentResponse>) => {
      const index = state.appointments.findIndex(
        apt => apt.appointmentId === action.payload.appointmentId
      );
      if (index !== -1) {
        state.appointments[index] = action.payload;
      }
      
      // Update current if it's the same appointment
      if (state.currentAppointment?.appointmentId === action.payload.appointmentId) {
        state.currentAppointment = action.payload;
      }
    },
    
    // Add new appointment to list
    addAppointmentToList: (state, action: PayloadAction<AppointmentResponse>) => {
      const exists = state.appointments.some(
        apt => apt.appointmentId === action.payload.appointmentId
      );
      if (!exists) {
        state.appointments.unshift(action.payload);
      }
    },
    
    // Set selected location (from LocationPicker)
    setSelectedLocation: (state, action: PayloadAction<LocationSelectionResult>) => {
      state.selectedLocation = action.payload;
    },
    
    // Clear selected location
    clearSelectedLocation: (state) => {
      state.selectedLocation = null;
    },
  },
  
  extraReducers: (builder) => {
    // Validate Preconditions
    builder
      .addCase(validatePreconditions.pending, (state) => {
        state.validationError = null;
        state.validationChecked = false;
      })
      .addCase(validatePreconditions.fulfilled, (state, action) => {
        state.validationChecked = true;
        if (!action.payload.isValid) {
          state.validationError = action.payload.message;
        }
      })
      .addCase(validatePreconditions.rejected, (state, action) => {
        state.validationError = action.payload as string;
        state.validationChecked = true;
      });
    
    // Create Appointment
    builder
      .addCase(createAppointment.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.creating = false;
        state.appointments.unshift(action.payload);
        state.currentAppointment = action.payload;
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      });
    
    // Fetch Appointment by ID
    builder
      .addCase(fetchAppointmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAppointment = action.payload;
      })
      .addCase(fetchAppointmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Fetch Appointments by Match
    builder
      .addCase(fetchAppointmentsByMatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentsByMatch.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchAppointmentsByMatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Fetch My Appointments
    builder
      .addCase(fetchMyAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchMyAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Respond to Appointment
    builder
      .addCase(respondToAppointment.pending, (state) => {
        state.responding = true;
        state.error = null;
      })
      .addCase(respondToAppointment.fulfilled, (state, action) => {
        state.responding = false;
        state.currentAppointment = action.payload;
        
        // Update in list
        const index = state.appointments.findIndex(
          apt => apt.appointmentId === action.payload.appointmentId
        );
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
      })
      .addCase(respondToAppointment.rejected, (state, action) => {
        state.responding = false;
        state.error = action.payload as string;
      });
    
    // Counter-Offer
    builder
      .addCase(counterOfferAppointment.pending, (state) => {
        state.counterOffering = true;
        state.error = null;
      })
      .addCase(counterOfferAppointment.fulfilled, (state, action) => {
        state.counterOffering = false;
        state.currentAppointment = action.payload;
        
        // Update in list
        const index = state.appointments.findIndex(
          apt => apt.appointmentId === action.payload.appointmentId
        );
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
      })
      .addCase(counterOfferAppointment.rejected, (state, action) => {
        state.counterOffering = false;
        state.error = action.payload as string;
      });
    
    // Cancel Appointment
    builder
      .addCase(cancelAppointment.pending, (state) => {
        state.cancelling = true;
        state.error = null;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.cancelling = false;
        state.currentAppointment = action.payload;
        
        // Update in list
        const index = state.appointments.findIndex(
          apt => apt.appointmentId === action.payload.appointmentId
        );
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.cancelling = false;
        state.error = action.payload as string;
      });
    
    // Check-in
    builder
      .addCase(checkInAppointment.pending, (state) => {
        state.checkingIn = true;
        state.error = null;
      })
      .addCase(checkInAppointment.fulfilled, (state, action) => {
        state.checkingIn = false;
        state.currentAppointment = action.payload;
        
        // Update in list
        const index = state.appointments.findIndex(
          apt => apt.appointmentId === action.payload.appointmentId
        );
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
      })
      .addCase(checkInAppointment.rejected, (state, action) => {
        state.checkingIn = false;
        state.error = action.payload as string;
      });
    
    // Complete Appointment
    builder
      .addCase(completeAppointment.pending, (state) => {
        state.completing = true;
        state.error = null;
      })
      .addCase(completeAppointment.fulfilled, (state, action) => {
        state.completing = false;
        state.currentAppointment = action.payload;
        
        // Update in list
        const index = state.appointments.findIndex(
          apt => apt.appointmentId === action.payload.appointmentId
        );
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
      })
      .addCase(completeAppointment.rejected, (state, action) => {
        state.completing = false;
        state.error = action.payload as string;
      });
  },
});

// ============================================
// ACTIONS
// ============================================

export const {
  clearCurrentAppointment,
  clearError,
  clearValidation,
  resetAppointmentState,
  updateAppointmentInList,
  addAppointmentToList,
  setSelectedLocation,
  clearSelectedLocation,
} = appointmentSlice.actions;

// ============================================
// SELECTORS
// ============================================

export const selectAppointments = (state: RootState) => state.appointment.appointments;
export const selectCurrentAppointment = (state: RootState) => state.appointment.currentAppointment;
export const selectLocations = (state: RootState) => state.appointment.locations;
export const selectSelectedLocation = (state: RootState) => state.appointment.selectedLocation;
export const selectAppointmentLoading = (state: RootState) => state.appointment.loading;
export const selectLocationsLoading = (state: RootState) => state.appointment.locationsLoading;
export const selectAppointmentError = (state: RootState) => state.appointment.error;
export const selectValidationError = (state: RootState) => state.appointment.validationError;
export const selectValidationChecked = (state: RootState) => state.appointment.validationChecked;

// Action-specific selectors
export const selectIsCreating = (state: RootState) => state.appointment.creating;
export const selectIsResponding = (state: RootState) => state.appointment.responding;
export const selectIsCancelling = (state: RootState) => state.appointment.cancelling;
export const selectIsCheckingIn = (state: RootState) => state.appointment.checkingIn;
export const selectIsCounterOffering = (state: RootState) => state.appointment.counterOffering;
export const selectIsCompleting = (state: RootState) => state.appointment.completing;

// Filtered selectors (memoized)
export const selectAppointmentsByStatus = (status: AppointmentStatus) => 
  createSelector(
    [selectAppointments],
    (appointments) => appointments.filter(apt => apt.status === status)
  );

export const selectUpcomingAppointments = createSelector(
  [selectAppointments],
  (appointments) => 
    appointments
      .filter(apt => 
        ['pending', 'confirmed', 'on_going'].includes(apt.status)
      )
      .sort((a, b) => 
        new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime()
      )
);

export const selectPastAppointments = createSelector(
  [selectAppointments],
  (appointments) => 
    appointments
      .filter(apt => 
        ['completed', 'cancelled', 'no_show', 'rejected'].includes(apt.status)
      )
      .sort((a, b) => 
        new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime()
      )
);

export const selectOngoingAppointments = createSelector(
  [selectAppointments],
  (appointments) => 
    appointments
      .filter(apt => apt.status === 'on_going')
      .sort((a, b) => 
        new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime()
      )
);

export const selectCompletedAppointments = createSelector(
  [selectAppointments],
  (appointments) => 
    appointments
      .filter(apt => apt.status === 'completed')
      .sort((a, b) => 
        new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime()
      )
);

export default appointmentSlice.reducer;
