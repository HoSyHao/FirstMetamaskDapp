import { configureStore, combineReducers } from '@reduxjs/toolkit';
import walletReducer from './slices/walletSlice';
import contractReducer from './slices/contractSlice';
import transactionsReducer from './slices/transactionsSlice';
import eventsReducer from './slices/eventsSlice';

const rootReducer = combineReducers({
  wallet: walletReducer,
  contract: contractReducer,
  transactions: transactionsReducer,
  events: eventsReducer,
});

const store = configureStore({
  reducer: rootReducer,
});

export default store;