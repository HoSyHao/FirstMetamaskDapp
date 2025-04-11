import { createSlice } from '@reduxjs/toolkit';

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    account: null,
    balance: null,
    network: null,
    message: null,
  },
  reducers: {
    setWalletInfo: (state, action) => {
      state.account = action.payload.account;
      state.balance = action.payload.balance;
      state.network = action.payload.network;
      state.message = action.payload.message || null;
    },
    clearWalletInfo: (state) => {
      state.account = null;
      state.balance = null;
      state.network = null;
      state.message = 'Disconnected successfully';
    },
    setAccountChanged: (state, action) => {
      state.account = action.payload;
      state.message = 'Account changed to ' + action.payload.slice(0, 6) + '...';
    },
    setNetworkChanged: (state, action) => {
      state.network = action.payload;
      state.message = 'Network changed to ' + action.payload;
    },
  },
});

export const { setWalletInfo, clearWalletInfo, setAccountChanged, setNetworkChanged } = walletSlice.actions;
export default walletSlice.reducer;