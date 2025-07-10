import { useDispatch, useSelector } from 'react-redux';
import { useAppKitAccount } from '@reown/appkit/react';
import useMarketplace from '../../hooks/useMarketplace';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import LoadingOverlay from '../LoadingOverlay';
import { ethers } from 'ethers';
import { addListing, removeListing } from '../../redux/slices/marketplace/listingSlice';
import { socket } from '../../lib/socketClient';
import { addTransaction } from '../../redux/slices/marketplace/transactionsSlice';
import { loadUser } from '../../redux/slices/marketplace/userSlice';

const AvailableListing = () => {
  const { items, loading, error } = useSelector((state) => state.listings);
  const { address: account } = useAppKitAccount();
  const { buyItem } = useMarketplace(account);
  const [isBuying, setIsBuying] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (account) {
      const normalizedAddress = account.toLowerCase();
      socket.emit('subscribe', { userAddress: normalizedAddress });
    }
    const handleMarketplaceUpdate = (data) => {
      console.log('Received marketplaceUpdate data:', data);
      const { type, listingId, seller, userAddress, price, tokenId, sellerTransaction, buyerTransaction } = data;
      if (type === 'ListingCancelled' && listingId) {
        dispatch(removeListing(listingId));
      } if (type === 'ItemSold' && listingId) {
        dispatch(removeListing(listingId));
        if (seller && account && seller.toLowerCase() === account.toLowerCase()) {
          console.log(`Seller match: ${seller} === ${account}`);
          try {
            dispatch(loadUser(account)); // Cập nhật totalEarnings
            toast.success('🎉 Your NFT has been sold! Check your earnings.');
            if (sellerTransaction) {
              const parsedSellerTransaction = typeof sellerTransaction === 'string' ? JSON.parse(sellerTransaction) : sellerTransaction;
              console.log('Seller transaction payload:', parsedSellerTransaction);
              dispatch(addTransaction(parsedSellerTransaction));
              console.log('Dispatched addTransaction for seller');
            }
          } catch (error) {
            console.error('Error in loadUser or addTransaction:', error);
          }
        }
        // Handle buyer transaction
        if (buyerTransaction && userAddress.toLowerCase() === account.toLowerCase()) {
          const parsedBuyerTransaction = typeof buyerTransaction === 'string' ? JSON.parse(buyerTransaction) : buyerTransaction;
          console.log('Buyer transaction payload:', parsedBuyerTransaction);
          dispatch(addTransaction(parsedBuyerTransaction));
          console.log('Dispatched addTransaction for buyer');
        }
      } else if (type === 'ItemListed' && data.listingId && data.listingId !== 'pending') {
        dispatch(addListing({ id: data.listingId, tokenId: data.tokenId, price: data.price, seller: data.userAddress }));
      }
    };
    socket.on('marketplaceUpdate', handleMarketplaceUpdate);
    return () => socket.off('marketplaceUpdate', handleMarketplaceUpdate);
  }, [account, dispatch]);

  const handleBuy = async (listingId) => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsBuying(listingId);
    try {
      const result = await buyItem(listingId);
      if (result) {
        const listing = items.find(item => item.id === listingId);
        const seller = listing?.seller;
        if (!seller) {
          console.error('Seller not found in listing:', listing);
          return;
        }
        console.log('Buy completed, transaction dispatched in service');
      }
    } finally {
      setIsBuying(null);
    }
  };

  if (loading) return <p className="text-center text-gray-400 animate-pulse">Loading listings...</p>;
  if (error) return <p className="text-center text-red-400">Error: {error}</p>;

  return (
    <div>
      {items.length === 0 ? (
        <p className="text-center text-gray-500">No listings available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((listing) => {
            const isOwner = account?.toLowerCase() === listing.seller?.toLowerCase();
            const priceInTBNB = ethers.formatEther(listing.price).replace('.', ',');
            return (
              <div key={listing.id} className="bg-gray-700 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
                <p className="text-gray-300">Listing ID: <span className="font-medium">{listing.id}</span></p>
                <p className="text-gray-400">Token ID: <span className="font-medium">{listing.tokenId}</span></p>
                <p className="text-gray-400">Price: {priceInTBNB} tBNB</p>
                <p className="text-gray-500">Seller: {listing.seller?.slice(0, 6)}...{listing.seller?.slice(-4)}</p>
                {!isOwner && (
                  <button
                    onClick={() => handleBuy(listing.id)}
                    disabled={isBuying === listing.id}
                    className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    Buy
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {isBuying !== null && <LoadingOverlay message="Processing buying..." />}
    </div>
  );
};

export default AvailableListing;