import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '../../../constants/api';
import { apiClient } from '../../../lib/apiClient';

export const loadUserNFTs = createAsyncThunk(
  'nfts/loadUserNFTs',
  async ({ userAddress, page, limit }, { rejectWithValue, getState }) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_NFTS(userAddress), {
        params: { page, limit },
      });
      if (!response.data.success) {
        return rejectWithValue(response.data.error || 'Unknown error');
      }
      const existingItems = getState().nfts.items || [];
      const newItems = response.data.data.nftsOwned.map(nft => ({
        ...nft,
        metadata: nft.metadata || null,
        timestamp: nft.createdAt || new Date().toISOString(),
      }));
      const uniqueItems = [...existingItems, ...newItems].filter((item, index, self) =>
        index === self.findIndex((t) => t.tokenId === item.tokenId)
      );
      return { items: uniqueItems, total: response.data.total || uniqueItems.length };
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message || error);
      return rejectWithValue(error.response?.data?.error || error.message || 'Unknown error');
    }
  }
);

const nftSlice = createSlice({
  name: 'nfts',
  initialState: {
    items: [],
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {
    addNFT: (state, action) => {
      const { tokenId, tokenURI, timestamp, metadata } = action.payload;
      const existingNFTIndex = state.items.findIndex(nft => nft.tokenId === tokenId);
      if (existingNFTIndex !== -1) {
        state.items[existingNFTIndex] = {
          ...state.items[existingNFTIndex],
          tokenURI: tokenURI || state.items[existingNFTIndex].tokenURI,
          metadata: metadata || state.items[existingNFTIndex].metadata,
          timestamp: timestamp || state.items[existingNFTIndex].timestamp,
        };
      } else {
        state.items.push({ tokenId, tokenURI, timestamp: timestamp || new Date().toISOString(), metadata: metadata || null });
      }
      state.items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },
    removeNFT: (state, action) => {
      const tokenId = action.payload;
      state.items = state.items.filter(item => item.tokenId !== tokenId);
    },
    resetItems: (state) => {
      state.items = [];
      state.total = 0;
    },
    
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserNFTs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserNFTs.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.loading = false;
      })
      .addCase(loadUserNFTs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { addNFT, removeNFT, resetItems } = nftSlice.actions;
export default nftSlice.reducer;