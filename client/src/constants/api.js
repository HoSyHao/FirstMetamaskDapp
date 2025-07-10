export const API_URL = import.meta.env.VITE_API_URL;
export const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const API_ENDPOINTS = {
  USER_NFTS: (userAddress) => `${API_URL}/users/${userAddress}`,
  LISTINGS: `${API_URL}/listings`,
  TRANSACTIONS: `${API_URL}/transactions`,
};