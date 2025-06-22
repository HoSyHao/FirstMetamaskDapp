import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '../../constants/api';
import { apiClient } from '../../lib/api-client';

export const loadListings = createAsyncThunk(
  'listings/loadListings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LISTINGS);
      return response.data.success ? response.data.data || [] : rejectWithValue('Failed to fetch listings');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const listingSlice = createSlice({
  name: 'listings',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadListings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadListings.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(loadListings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default listingSlice.reducer;