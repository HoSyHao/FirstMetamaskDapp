import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '../../../constants/api';
import { apiClient } from '../../../lib/apiClient';

export const loadTransactionHistory = createAsyncThunk(
  'transactions/loadTransactionHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TRANSACTIONS);
      if (!response.data.success) {
        return rejectWithValue(response.data.error || 'Unknown error');
      }
      return response.data.data || [];
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const transactionSlice = createSlice({
  name: 'transactionM',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    addTransaction: (state, action) => {
      const newTransaction = action.payload;
      console.log('Adding transaction:', newTransaction);
      // Kiểm tra trùng lặp dựa trên id
      if (!state.items.some(item => item.id === newTransaction.id)) {
        state.items = [newTransaction, ...state.items];
      } else {
        console.log(`Transaction with id ${newTransaction.id} already exists, skipping`);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTransactionHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTransactionHistory.fulfilled, (state, action) => {
        state.items = action.payload.map(item => ({
          id: item.id || 'N/A',
          listing: { id: item.listing?.id || 'N/A', tokenId: item.listing?.tokenId || 'N/A' },
          buyer: item.buyer ? item.buyer : 'N/A',
          seller: item.seller ? item.seller : 'N/A',
          price: item.price?.toString() || '0',
          timestamp: item.timestamp || new Date().toISOString(),
        }));
        state.loading = false;
      })
      .addCase(loadTransactionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { addTransaction } = transactionSlice.actions;
export default transactionSlice.reducer;