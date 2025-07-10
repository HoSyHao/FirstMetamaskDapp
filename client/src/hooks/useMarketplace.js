import { useEffect, useState } from 'react';
import { BrowserProvider, ethers } from 'ethers';
import { useDispatch } from 'react-redux';
import { useAppKitProvider, useAppKitNetworkCore } from '@reown/appkit/react';
import { mintNFT, buyItem, listItem, cancelListing } from '../services/marketplaceService';
import { marketplaceABI, marketplaceAddress, nftCollectionABI, nftCollectionAddress, BSC_TESTNET_CHAIN_ID } from '../constants/contract';
import { INFURA_BSC_TESTNET_URL } from '../constants/infura';
import { toast } from 'react-toastify'; // Import toast

const useMarketplace = (account) => {
  const dispatch = useDispatch();
  const [marketplaceContract, setMarketplaceContract] = useState(null);
  const [nftCollectionContract, setNftCollectionContract] = useState(null);
  const { walletProvider } = useAppKitProvider('eip155');
  const { chainId } = useAppKitNetworkCore();
  const infuraProvider = new ethers.JsonRpcProvider(INFURA_BSC_TESTNET_URL);

  const updateBalances = async () => {
    // Logic cập nhật balance nếu cần, gọi API BE nếu có
  };

  useEffect(() => {
    const initContracts = async () => {
      try {
        // Khởi tạo contract read-only
        const marketplaceReadOnly = new ethers.Contract(marketplaceAddress, marketplaceABI, infuraProvider);
        const nftCollectionReadOnly = new ethers.Contract(nftCollectionAddress, nftCollectionABI, infuraProvider);

        if (account && walletProvider) {
          const provider = new BrowserProvider(walletProvider, chainId);
          if (chainId.toString(16) !== BSC_TESTNET_CHAIN_ID.slice(2)) {
            toast.error('Please switch to BSC Testnet');
            return;
          }
          const signer = await provider.getSigner();

          // Khởi tạo contract với signer
          const marketplaceWithSigner = new ethers.Contract(marketplaceAddress, marketplaceABI, signer);
          marketplaceWithSigner.signer = signer;
          setMarketplaceContract(marketplaceWithSigner);

          const nftCollectionWithSigner = new ethers.Contract(nftCollectionAddress, nftCollectionABI, signer);
          nftCollectionWithSigner.signer = signer;
          setNftCollectionContract(nftCollectionWithSigner);
        } else {
          setMarketplaceContract(marketplaceReadOnly);
          setNftCollectionContract(nftCollectionReadOnly);
        }
      } catch (error) {
        console.error('Error initializing contracts:', error);
      }
    };
    initContracts();
  }, [account, dispatch, walletProvider, chainId]);

  return {
    marketplaceContract,
    nftCollectionContract,
    mintNFT: (quantity) => mintNFT(nftCollectionContract, quantity, account, dispatch, updateBalances),
    buyItem: (listingId) => buyItem(marketplaceContract, listingId, account, dispatch, updateBalances),
    listItem: (tokenId, price) => listItem(marketplaceContract, tokenId, price, account, dispatch, updateBalances),
    cancelListing: (listingId) => cancelListing(marketplaceContract, listingId, account, dispatch, updateBalances),
  };
};

export default useMarketplace;