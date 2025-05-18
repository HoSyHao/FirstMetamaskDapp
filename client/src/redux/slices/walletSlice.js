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
      state.message = action.payload.message;
    },
    clearWalletInfo: (state) => {
      state.account = null;
      state.balance = null;
      state.network = null;
      state.message = null;
    },
    setAccountChanged: (state, action) => {
      state.account = action.payload;
    },
    setNetworkChanged: (state, action) => {
      state.network = action.payload;
    },
    updateBalance: (state, action) => {
      state.balance = action.payload;
    },
  },
});

export const { setWalletInfo, clearWalletInfo, setAccountChanged, setNetworkChanged, updateBalance } = walletSlice.actions;
export default walletSlice.reducer;