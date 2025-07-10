// src/redux/slices/marketplace/listingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '../../../constants/api';
import { apiClient } from '../../../lib/apiClient';

export const loadListings = createAsyncThunk(
  'listings/loadListings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LISTINGS);
      if (!response.data.success) {
        return rejectWithValue(response.data.error || 'Failed to fetch listings');
      }
      return response.data.data || [];
    } catch (error) {
      console.error('API Error for Listings:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || error.message);
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
  reducers: {
    addListing: (state, action) => {
      const { id, tokenId, price, seller } = action.payload;
      if (!state.items.some(item => item.id === id)) {
        state.items.push({ id, tokenId, price, seller });
      }
    },
    removeListing: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter(item => item.id !== id);
    },
  },
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

export const { addListing, removeListing } = listingSlice.actions;
export default listingSlice.reducer;