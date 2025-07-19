import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '../../../constants/api';
import { apiClient } from '../../../lib/apiClient';

export const loadTransactionHistory = createAsyncThunk(
  'transactions/loadTransactionHistory',
  async ({ page, limit }, { rejectWithValue, getState }) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TRANSACTIONS, {
        params: { page, limit },
      });
      if (!response.data.success) {
        return rejectWithValue(response.data.error || 'Unknown error');
      }
      const existingItems = getState().transactionM.items || [];
      const newItems = response.data.data || [];
      const uniqueItems = page === 1 ? newItems : [...existingItems, ...newItems].filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
      );
      return { items: uniqueItems, total: response.data.total || uniqueItems.length }; // Thêm total từ server
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
    total: 0, // Thêm trường total
    loading: false,
    error: null,
  },
  reducers: {
    addTransaction: (state, action) => {
      const newTransaction = action.payload;
      console.log('Adding transaction:', newTransaction);
      if (!state.items.some(item => item.id === newTransaction.id)) {
        state.items = [newTransaction, ...state.items];
        state.items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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
        state.items = action.payload.items;
        state.total = action.payload.total; // Cập nhật total
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