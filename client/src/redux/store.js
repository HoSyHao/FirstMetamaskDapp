import { configureStore, combineReducers } from '@reduxjs/toolkit';
import walletReducer from './slices/walletSlice';
import contractReducer from './slices/training/contractSlice';
import transactionMReducer from './slices/marketplace/transactionsSlice';
import eventsReducer from './slices/training/eventsSlice';
import transactionsReducer from './slices/training/transactionsSlice';
import nftReducer from './slices/marketplace/nftSlice';
import listingReducer from './slices/marketplace/listingSlice';
import userReducer from './slices/marketplace/userSlice';

const rootReducer = combineReducers({
  wallet: walletReducer,
  contract: contractReducer,
  transactions: transactionsReducer,
  events: eventsReducer,
  nfts: nftReducer,
  listings: listingReducer,
  transactionM: transactionMReducer,
  user: userReducer,
});

const store = configureStore({
  reducer: rootReducer,
});

export default store;