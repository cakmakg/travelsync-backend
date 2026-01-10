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

export const createProperty = createAsyncThunk(
  'properties/create',
  async (data: Partial<Property>, { rejectWithValue }) => {
    try {
      const response = await propertyService.create(data);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue('Failed to create property');
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateProperty = createAsyncThunk(
  'properties/update',
  async ({ id, data }: { id: string; data: Partial<Property> }, { rejectWithValue }) => {
    try {
      const response = await propertyService.update(id, data);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue('Failed to update property');
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteProperty = createAsyncThunk(
  'properties/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await propertyService.delete(id);
      if (response.success) {
        return id;
      }
      return rejectWithValue('Failed to delete property');
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
    // Fetch all
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

    // Fetch by ID
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

    // Create
    builder.addCase(createProperty.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createProperty.fulfilled, (state, action) => {
      state.loading = false;
      state.properties.push(action.payload);
    });
    builder.addCase(createProperty.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update
    builder.addCase(updateProperty.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateProperty.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.properties.findIndex((p) => p._id === action.payload._id);
      if (index !== -1) {
        state.properties[index] = action.payload;
      }
    });
    builder.addCase(updateProperty.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete
    builder.addCase(deleteProperty.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteProperty.fulfilled, (state, action) => {
      state.loading = false;
      state.properties = state.properties.filter((p) => p._id !== action.payload);
    });
    builder.addCase(deleteProperty.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, setCurrentProperty } = propertiesSlice.actions;
export default propertiesSlice.reducer;
