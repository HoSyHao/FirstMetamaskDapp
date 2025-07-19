export const API_URL = import.meta.env.VITE_API_URL;
export const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const API_ENDPOINTS = {
  // User-related endpoints
  USER_NFTS: (userAddress) => `${API_URL}/users/${userAddress}`, // Lấy thông tin người dùng và NFT (sở hữu + đã list) với metadata
  // GET_NFT_METADATA: (tokenId) => `${API_URL}/nft/${tokenId}`, // Lấy metadata của một NFT
  MINT_METADATA: `${API_URL}/nft/mint-metadata`, // Tạo metadata cho NFT
  UPDATE_NFT_METADATA: (tokenId) => `${API_URL}/nft/${tokenId}/update`, // Cập nhật metadata cho NFT

  // Marketplace-related endpoints
  LISTINGS: (includeMetadata = false) => 
    `${API_URL}/listings${includeMetadata ? '?includeMetadata=true' : ''}`, // Lấy danh sách NFT đã list (có thể bao gồm metadata)
  TRANSACTIONS: `${API_URL}/transactions`, // Lấy lịch sử giao dịch
};