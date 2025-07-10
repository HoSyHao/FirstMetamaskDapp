import { useDispatch, useSelector } from 'react-redux';
import { useAppKitAccount } from '@reown/appkit/react';
import useMarketplace from '../../hooks/useMarketplace';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import LoadingOverlay from '../LoadingOverlay';
import { ethers } from 'ethers';
import { addListing, removeListing } from '../../redux/slices/marketplace/listingSlice';
import { socket } from '../../lib/socketClient';
import { loadUser } from '../../redux/slices/marketplace/userSlice';

const MyListings = () => {
  const { items: listings, loading, error } = useSelector((state) => state.listings);
  const { address: account } = useAppKitAccount();
  const { cancelListing } = useMarketplace(account);
  const [isCanceling, setIsCanceling] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (account) {
      const normalizedAddress = account.toLowerCase();
      socket.emit('subscribe', { userAddress: normalizedAddress });
    }
    const handleMarketplaceUpdate = (data) => {
      const { type, listingId, userAddress } = data;
      if (type === 'ListingCancelled' && listingId) {
        dispatch(removeListing(listingId));
      } else if (type === 'ItemSold' && listingId && userAddress.toLowerCase() !== account.toLowerCase()) {
        dispatch(removeListing(listingId)); // Remove sold listing for seller
        dispatch(loadUser(account)); // Cập nhật totalEarnings
        toast.success('🎉 Your NFT has been sold! Check your earnings.');
      } else if (type === 'ItemListed' && listingId && listingId !== 'pending' && userAddress.toLowerCase() !== account.toLowerCase()) {
        // Kiểm tra trùng lặp trước khi thêm
        const existingListing = listings.find(item => item.id === listingId);
        if (!existingListing) {
          dispatch(addListing({ id: listingId, tokenId: data.tokenId, price: data.price, seller: userAddress }));
        }
      }
    };
    socket.on('marketplaceUpdate', handleMarketplaceUpdate);
    return () => socket.off('marketplaceUpdate', handleMarketplaceUpdate);
  }, [account, dispatch]);

  const handleCancel = async (listingId) => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsCanceling(listingId);
    try {
      const result = await cancelListing(listingId.toString());
      if (result) {
        socket.emit('marketplaceEvent', {
          type: 'ListingCancelled',
          userAddress: account,
          listingId: listingId.toString(),
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      setIsCanceling(null);
    }
  };

  if (loading) return <p className="text-center text-gray-400 animate-pulse">Loading listings...</p>;
  if (error) return <p className="text-center text-red-400">Error: {error}</p>;

  const nftsListed = listings.filter((listing) => listing.seller?.toLowerCase() === account?.toLowerCase());

  return (
    <div>
      {nftsListed.length === 0 ? (
        <p className="text-center text-gray-500">No listings available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {nftsListed.map((listing) => (
            <div key={listing.id} className="bg-gray-700 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <p className="text-gray-300">Listing ID: <span className="font-medium">{listing.id}</span></p>
              <p className="text-gray-400">Token ID: <span className="font-medium">{listing.tokenId}</span></p>
              <p className="text-gray-400">Price: {ethers.formatEther(listing.price).replace('.', ',')} tBNB</p>
              <button
                onClick={() => handleCancel(listing.id)}
                disabled={isCanceling === listing.id}
                className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                Cancel Listing
              </button>
            </div>
          ))}
        </div>
      )}
      {isCanceling !== null && <LoadingOverlay message="Processing canceling..." />}
    </div>
  );
};

export default MyListings;