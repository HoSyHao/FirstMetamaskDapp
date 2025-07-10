import { createSlice } from '@reduxjs/toolkit';

const contractSlice = createSlice({
  name: 'contract',
  initialState: {
    counter: '0',
    contractBalance: '0',
    userBalance: '0',
    isLoading: false,
  },
  reducers: {
    setCounter: (state, action) => {
      state.counter = action.payload;
    },
    setContractBalance: (state, action) => {
      state.contractBalance = action.payload;
    },
    setUserBalance: (state, action) => {
      state.userBalance = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCounter, setContractBalance, setUserBalance, setLoading } = contractSlice.actions;
export default contractSlice.reducer;