import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  account: null,
  balance: null,
  network: null,
  message: null,
  transactions: [],
  events: [],
  counter: '0',
  contractBalance: '0',
  userBalance: '0',
  isLoading: false,
};

const loadTransactionsFromStorage = () => {
  try {
    const stored = localStorage.getItem('transactions');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading transactions from storage:', error);
    return [];
  }
};

const loadEventsFromStorage = () => {
  try {
    const stored = localStorage.getItem('contractEvents');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading events from storage:', error);
    return [];
  }
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    ...initialState,
    transactions: loadTransactionsFromStorage(),
    events: loadEventsFromStorage(),
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
      state.transactions = [];
      state.events = [];
    },
    setAccountChanged: (state, action) => {
      state.account = action.payload;
    },
    setNetworkChanged: (state, action) => {
      state.network = action.payload;
    },
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
    addEvent: (state, action) => {
      state.events.unshift(action.payload);
      localStorage.setItem('contractEvents', JSON.stringify(state.events));
    },
    setEvents: (state, action) => {
      state.events = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setCounter: (state, action) => {
      state.counter = action.payload;
    },
    setContractBalance: (state, action) => {
      state.contractBalance = action.payload;
    },
    setUserBalance: (state, action) => {
      state.userBalance = action.payload;
    },
    triggerBalanceUpdate: (state) => {
      
    },
  },
});

export const {
  setWalletInfo,
  clearWalletInfo,
  setAccountChanged,
  setNetworkChanged,
  addTransaction,
  updateTransaction,
  addEvent,
  setEvents,
  setLoading,
  setCounter,
  setContractBalance,
  setUserBalance,
  triggerBalanceUpdate,
} = walletSlice.actions;

export default walletSlice.reducer;