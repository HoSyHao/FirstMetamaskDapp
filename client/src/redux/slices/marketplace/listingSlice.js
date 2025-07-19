import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '../../../constants/api';
import { apiClient } from '../../../lib/apiClient';

export const loadListings = createAsyncThunk(
  'listings/loadListings',
  async ({ page, limit, seller, includeMetadata = false }, { rejectWithValue, getState }) => {
    try {
      const url = API_ENDPOINTS.LISTINGS(includeMetadata);
      const response = await apiClient.get(url, {
        params: { page, limit, seller },
      });
      if (!response.data.success) {
        return rejectWithValue(response.data.error || 'Failed to fetch listings');
      }
      const existingItems = getState().listings.items || [];
      const newItems = response.data.data || [];
      const uniqueItems = [...existingItems, ...newItems].filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
      );
      return { items: uniqueItems, total: response.data.total || uniqueItems.length };
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
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {
    addListing: (state, action) => {
      const { id, tokenId, price, seller, timestamp } = action.payload;
      if (!state.items.some(item => item.id === id)) {
        state.items.push({ id, tokenId, price, seller, timestamp: timestamp || new Date().toISOString(), metadata: {} });
        state.items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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
        state.items = action.payload.items;
        state.total = action.payload.total;
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