import { createSlice } from '@reduxjs/toolkit';

const loadFromStorage = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return [];
  }
};

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState: {
    transactions: loadFromStorage('transactions'),
  },
  reducers: {
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload);
      localStorage.setItem('transactions', JSON.stringify(state.transactions));
    },
    updateTransaction: (state, action) => {
      const { hash, status } = action.payload;
      const transactionIndex = state.transactions.findIndex((tx) => tx.hash === hash);
      if (transactionIndex !== -1) {
        state.transactions[transactionIndex].status = status;
        state.transactions[transactionIndex].timestamp = new Date().toISOString();
        localStorage.setItem('transactions', JSON.stringify(state.transactions));
      }
    },
  },
});

export const { addTransaction, updateTransaction } = transactionsSlice.actions;
export default transactionsSlice.reducer;