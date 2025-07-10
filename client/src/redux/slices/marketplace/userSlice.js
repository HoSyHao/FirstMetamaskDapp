import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '../../../constants/api';
import { apiClient } from '../../../lib/apiClient';

export const loadUser = createAsyncThunk(
  'user/loadUser',
  async (userAddress, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_NFTS(userAddress));
      if (!response.data.success) {
        return rejectWithValue(response.data.error || 'Unknown error');
      }
      return response.data.data || { totalEarnings: '0' };
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    totalEarnings: '0',
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.totalEarnings = action.payload.totalEarnings || '0';
        state.loading = false;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {} = userSlice.actions;
export default userSlice.reducer;