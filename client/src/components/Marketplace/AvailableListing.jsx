import { useDispatch, useSelector } from 'react-redux';
import { useAppKitAccount } from '@reown/appkit/react';
import useMarketplace from '../../hooks/useMarketplace';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import LoadingOverlay from '../LoadingOverlay';
import { ethers } from 'ethers';
import { addListing, removeListing, loadListings } from '../../redux/slices/marketplace/listingSlice';
import { socket } from '../../lib/socketClient';
import { loadUser } from '../../redux/slices/marketplace/userSlice';
import { addTransaction } from '../../redux/slices/marketplace/transactionsSlice';
import Pagination from '../Pagination';
import NFTDetail from './NFTDetail';

const AvailableListing = () => {
  const { items, total, loading, error } = useSelector((state) => state.listings);
  const { address: account } = useAppKitAccount();
  const { buyItem } = useMarketplace(account);
  const [isBuying, setIsBuying] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const dispatch = useDispatch();
  const [selectedNFT, setSelectedNFT] = useState(null);

  useEffect(() => {
    if (account) {
      const normalizedAddress = account.toLowerCase();
      socket.emit('subscribe', { userAddress: normalizedAddress });
      loadPagesIfNeeded(currentPage);
    }
  }, [account, dispatch, currentPage]);

  const loadPagesIfNeeded = async (targetPage) => {
    const pagesToLoad = [];
    for (let page = 1; page <= targetPage; page++) {
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = page * itemsPerPage;
      const hasAllItems = items.length >= endIndex && items.slice(startIndex, endIndex).length === itemsPerPage;
      if (!hasAllItems) {
        pagesToLoad.push(page);
      }
    }
    for (const page of pagesToLoad) {
      await dispatch(loadListings({ page, limit: itemsPerPage, includeMetadata: true })).unwrap();
    }
  };

  useEffect(() => {
    const handleMarketplaceUpdate = (data) => {
      console.log('Received marketplaceUpdate data:', data);
      const { type, listingId, seller, userAddress, price, tokenId, sellerTransaction, buyerTransaction } = data;
      if (type === 'ListingCancelled' && listingId) {
        dispatch(removeListing(listingId));
      } else if (type === 'ItemSold' && listingId) {
        dispatch(removeListing(listingId));
        if (seller && account && seller.toLowerCase() === account.toLowerCase()) {
          try {
            dispatch(loadUser(account));
            toast.success('🎉 Your NFT has been sold! Check your earnings.');
            if (sellerTransaction) {
              const parsedSellerTransaction = typeof sellerTransaction === 'string' ? JSON.parse(sellerTransaction) : sellerTransaction;
              dispatch(addTransaction(parsedSellerTransaction));
            }
          } catch (error) {
            console.error('Error in loadUser or addTransaction:', error);
          }
        }
        if (buyerTransaction && userAddress.toLowerCase() === account.toLowerCase()) {
          const parsedBuyerTransaction = typeof buyerTransaction === 'string' ? JSON.parse(buyerTransaction) : buyerTransaction;
          dispatch(addTransaction(parsedBuyerTransaction));
        }
      } else if (type === 'ItemListed' && data.listingId && data.listingId !== 'pending') {
        dispatch(addListing({ id: data.listingId, tokenId, price, seller: userAddress, timestamp: new Date().toISOString() }));
      }
    };
    socket.on('marketplaceUpdate', handleMarketplaceUpdate);
    return () => socket.off('marketplaceUpdate', handleMarketplaceUpdate);
  }, [account, dispatch, items]);

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

  const openDetail = (listing) => {
    const detailedNFT = {
      tokenId: listing.tokenId,
      metadata: listing.metadata || { name: 'Unnamed NFT', description: '', attributes: [] },
      listingId: listing.id,
      price: listing.price,
      seller: listing.seller,
    };
    return detailedNFT;
  };

  if (loading && currentPage === 1) return <p className="text-center text-gray-400 animate-pulse">Loading listings...</p>;
  if (error) return <p className="text-center text-red-400">Error: {error}</p>;

  const sortedItems = [...items].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const totalPages = Math.ceil(total / itemsPerPage);
  const displayedItems = sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="relative">
      {displayedItems.length === 0 && !loading ? (
        <p className="text-center text-gray-500">No listings available.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" style={{ maxHeight: '60vh', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#4a5568 transparent' }}>
            {displayedItems.map((listing) => (
              <div
                key={listing.id}
                className="bg-gray-700 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200 min-h-[200px] cursor-pointer"
                onClick={() => setSelectedNFT(openDetail(listing))}
              >
                {listing.metadata?.image && (
                  <img
                    src={listing.metadata.image}
                    alt={listing.metadata?.name || 'Unnamed NFT'}
                    className="w-full h-40 object-cover rounded-md mb-2"
                  />
                )}
                <h3 className="text-white text-center">{listing.metadata?.name || 'Unnamed NFT'}</h3>
                <p className="text-gray-400 text-center">#{listing.tokenId}</p>
                <p className="text-gray-400">Price: {ethers.formatEther(listing.price).replace('.', ',')} tBNB</p>
                <p className="text-gray-500">Seller: {listing.seller?.slice(0, 6)}...{listing.seller?.slice(-4)}</p>
                {account?.toLowerCase() !== listing.seller?.toLowerCase() && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuy(listing.id);
                    }}
                    disabled={isBuying === listing.id}
                    className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    Buy
                  </button>
                )}
              </div>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
          />
        </>
      )}
      {isBuying !== null && <LoadingOverlay message="Processing buying..." />}
      {selectedNFT && (
        <NFTDetail
          nft={selectedNFT}
          isListing={isBuying !== null}
          isMetadataInvalid={() => !selectedNFT.metadata?.name || !selectedNFT.metadata?.image || !selectedNFT.metadata?.attributes}
          openModal={() => {}}
          setIsMetadataFormOpen={() => {}}
          setMetadataInputs={() => {}}
          setIsUpdateMode={() => {}}
          closeDetail={() => setSelectedNFT(null)}
          handleCancel={() => {}}
          handleBuy={handleBuy}
          fromMyListings={false}
        />
      )}
    </div>
  );
};

export default AvailableListing;