import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '../../constants/api';
import { apiClient } from '../../lib/api-client';

export const loadUserNFTs = createAsyncThunk(
  'nfts/loadUserNFTs',
  async (userAddress, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_NFTS(userAddress));
      if (!response.data.success) {
        return rejectWithValue(response.data.error || 'Unknown error');
      }
      return response.data.data.nftsOwned || [];
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const nftSlice = createSlice({
  name: 'nfts',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadUserNFTs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserNFTs.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(loadUserNFTs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default nftSlice.reducer;