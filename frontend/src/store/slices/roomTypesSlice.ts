import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { roomTypeService, CreateRoomTypeData, UpdateRoomTypeData } from '@/services/roomTypeService';
import { RoomType } from '@/types';
import { getErrorMessage } from '@/services/api';

interface RoomTypesState {
  roomTypes: RoomType[];
  currentRoomType: RoomType | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;
}

const initialState: RoomTypesState = {
  roomTypes: [],
  currentRoomType: null,
  loading: false,
  error: null,
  pagination: null,
};

// Fetch all room types
export const fetchRoomTypes = createAsyncThunk(
  'roomTypes/fetchAll',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const response = await roomTypeService.getAll(params);
      if (response.success) {
        return response;
      }
      return rejectWithValue('Failed to fetch room types');
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Fetch room types by property
export const fetchRoomTypesByProperty = createAsyncThunk(
  'roomTypes/fetchByProperty',
  async (propertyId: string, { rejectWithValue }) => {
    try {
      const response = await roomTypeService.getByProperty(propertyId);
      if (response.success) {
        return response;
      }
      return rejectWithValue('Failed to fetch room types');
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Create room type
export const createRoomType = createAsyncThunk(
  'roomTypes/create',
  async (data: CreateRoomTypeData, { rejectWithValue }) => {
    try {
      const response = await roomTypeService.create(data);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue('Failed to create room type');
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Update room type
export const updateRoomType = createAsyncThunk(
  'roomTypes/update',
  async ({ id, data }: { id: string; data: UpdateRoomTypeData }, { rejectWithValue }) => {
    try {
      const response = await roomTypeService.update(id, data);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue('Failed to update room type');
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Delete room type
export const deleteRoomType = createAsyncThunk(
  'roomTypes/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await roomTypeService.delete(id);
      if (response.success) {
        return id;
      }
      return rejectWithValue('Failed to delete room type');
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Toggle active status
export const toggleRoomTypeActive = createAsyncThunk(
  'roomTypes/toggleActive',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await roomTypeService.toggleActive(id);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue('Failed to toggle status');
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const roomTypesSlice = createSlice({
  name: 'roomTypes',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentRoomType: (state, action) => {
      state.currentRoomType = action.payload;
    },
    clearRoomTypes: (state) => {
      state.roomTypes = [];
      state.currentRoomType = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all
    builder.addCase(fetchRoomTypes.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRoomTypes.fulfilled, (state, action) => {
      state.loading = false;
      state.roomTypes = (action.payload.data as any)?.items || action.payload.data || [];
      state.pagination = action.payload.pagination || null;
    });
    builder.addCase(fetchRoomTypes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch by property
    builder.addCase(fetchRoomTypesByProperty.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRoomTypesByProperty.fulfilled, (state, action) => {
      state.loading = false;
      state.roomTypes = (action.payload.data as any)?.items || action.payload.data || [];
      state.pagination = action.payload.pagination || null;
    });
    builder.addCase(fetchRoomTypesByProperty.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create
    builder.addCase(createRoomType.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createRoomType.fulfilled, (state, action) => {
      state.loading = false;
      state.roomTypes.push(action.payload);
    });
    builder.addCase(createRoomType.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update
    builder.addCase(updateRoomType.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateRoomType.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.roomTypes.findIndex((rt) => rt._id === action.payload._id);
      if (index !== -1) {
        state.roomTypes[index] = action.payload;
      }
    });
    builder.addCase(updateRoomType.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete
    builder.addCase(deleteRoomType.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteRoomType.fulfilled, (state, action) => {
      state.loading = false;
      state.roomTypes = state.roomTypes.filter((rt) => rt._id !== action.payload);
    });
    builder.addCase(deleteRoomType.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Toggle active
    builder.addCase(toggleRoomTypeActive.fulfilled, (state, action) => {
      const index = state.roomTypes.findIndex((rt) => rt._id === action.payload._id);
      if (index !== -1) {
        state.roomTypes[index] = action.payload;
      }
    });
  },
});

export const { clearError, setCurrentRoomType, clearRoomTypes } = roomTypesSlice.actions;
export default roomTypesSlice.reducer;
