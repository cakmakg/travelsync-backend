import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { propertyService } from '@/services/propertyService';
import { Property } from '@/types';
import { getErrorMessage } from '@/services/api';

interface PropertiesState {
  properties: Property[];
  currentProperty: Property | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;
}

const initialState: PropertiesState = {
  properties: [],
  currentProperty: null,
  loading: false,
  error: null,
  pagination: null,
};

export const fetchProperties = createAsyncThunk(
  'properties/fetchAll',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const response = await propertyService.getAll(params);
      if (response.success) {
        return response;
      }
      return rejectWithValue('Failed to fetch properties');
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchPropertyById = createAsyncThunk(
  'properties/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await propertyService.getById(id);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue('Failed to fetch property');
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentProperty: (state, action) => {
      state.currentProperty = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProperties.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProperties.fulfilled, (state, action) => {
      state.loading = false;
      state.properties = action.payload.data?.items || action.payload.data || [];
      state.pagination = action.payload.pagination || null;
    });
    builder.addCase(fetchProperties.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchPropertyById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPropertyById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentProperty = action.payload;
    });
    builder.addCase(fetchPropertyById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, setCurrentProperty } = propertiesSlice.actions;
export default propertiesSlice.reducer;
