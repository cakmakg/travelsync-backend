import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reservationService } from '@/services/reservationService';
import { Reservation } from '@/types';
import { getErrorMessage } from '@/services/api';

interface ReservationsState {
  reservations: Reservation[];
  currentReservation: Reservation | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;
}

const initialState: ReservationsState = {
  reservations: [],
  currentReservation: null,
  loading: false,
  error: null,
  pagination: null,
};

export const fetchReservations = createAsyncThunk(
  'reservations/fetchAll',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const response = await reservationService.getAll(params);
      if (response.success) {
        return response;
      }
      return rejectWithValue('Failed to fetch reservations');
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createReservation = createAsyncThunk(
  'reservations/create',
  async (data: Record<string, any>, { rejectWithValue }) => {
    try {
      const response = await reservationService.create(data);
      if (response.success) {
        return response.data;
      }
      return rejectWithValue('Failed to create reservation');
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const reservationsSlice = createSlice({
  name: 'reservations',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchReservations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchReservations.fulfilled, (state, action) => {
      state.loading = false;
      state.reservations = action.payload.data?.items || action.payload.data || [];
      state.pagination = action.payload.pagination || null;
    });
    builder.addCase(fetchReservations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    // Create reservation
    builder.addCase(createReservation.fulfilled, (state, action) => {
      if (action.payload) {
        state.reservations.unshift(action.payload);
      }
    });
    builder.addCase(createReservation.rejected, (state, action) => {
      state.error = action.payload as string;
    });
  },
});

export const { clearError } = reservationsSlice.actions;
export default reservationsSlice.reducer;
