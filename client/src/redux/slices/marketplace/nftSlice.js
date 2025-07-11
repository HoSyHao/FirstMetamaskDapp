import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '../../../constants/api';
import { apiClient } from '../../../lib/apiClient';

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
  reducers: {
    addNFT: (state, action) => {
      const { tokenId, tokenURI } = action.payload;
      const existingNFT = state.items.find(nft => nft.tokenId === tokenId);
      if (existingNFT) {
        existingNFT.tokenURI = tokenURI;
      } else {
        state.items.push({ tokenId, tokenURI });
      }
    },
    removeNFT: (state, action) => {
      const tokenId = action.payload;
      state.items = state.items.filter(item => item.tokenId !== tokenId);
    },
  },
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

export const { addNFT, removeNFT } = nftSlice.actions;
export default nftSlice.reducer;