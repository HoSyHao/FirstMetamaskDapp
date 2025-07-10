import { useDispatch, useSelector } from 'react-redux';
import { useAppKitAccount } from '@reown/appkit/react';
import useMarketplace from '../../hooks/useMarketplace';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import LoadingOverlay from '../LoadingOverlay';
import { ethers } from 'ethers';
import { addNFT, removeNFT } from '../../redux/slices/marketplace/nftSlice';
import { loadUser } from '../../redux/slices/marketplace/userSlice';
import { socket } from '../../lib/socketClient';
import { addListing, removeListing } from '../../redux/slices/marketplace/listingSlice';

const UserNFTs = () => {
  const { items, loading, error } = useSelector((state) => state.nfts);
  const dispatch = useDispatch();
  const { address: account } = useAppKitAccount();
  const { mintNFT, listItem } = useMarketplace(account);
  const [isMinting, setIsMinting] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [priceInput, setPriceInput] = useState('');

  useEffect(() => {
    if (account) {
      const normalizedAddress = account.toLowerCase();
      socket.emit('subscribe', { userAddress: normalizedAddress });
    }
    const handleMarketplaceUpdate = (data) => {
      const { type, tokenId, tokenURI, listingId, buyerTokenURI, userAddress, seller } = data;
      if (type === 'ListingCancelled' && listingId) {
        dispatch(removeListing(listingId));
      } if (type === 'ItemSold' && data.userAddress.toLowerCase() === account.toLowerCase()) {
        dispatch(addNFT({ tokenId, tokenURI: buyerTokenURI || tokenURI || 'Loading...' }));
      } else if (type === 'ItemSold' && seller && seller.toLowerCase() === account.toLowerCase()) {
        dispatch(removeListing(listingId));
        dispatch(loadUser(account));
        toast.success('🎉 Your NFT has been sold! Check your earnings.');
      } else if (type === 'ItemListed' && tokenId === selectedTokenId && userAddress.toLowerCase() === account.toLowerCase()) {
        dispatch(removeNFT(tokenId));
      } else if (type === 'ItemListed' && listingId && listingId !== 'pending' && userAddress.toLowerCase() !== account.toLowerCase()) {

        dispatch(addListing({ id: listingId, tokenId: data.tokenId, price: data.price, seller: userAddress }));

      }
    };
    socket.on('marketplaceUpdate', handleMarketplaceUpdate);
    return () => socket.off('marketplaceUpdate', handleMarketplaceUpdate);
  }, [account, dispatch, selectedTokenId]);

  const handleMint = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsMinting(true);
    try {
      const result = await mintNFT(1);
      if (result) {
        socket.emit('marketplaceEvent', {
          type: 'NFTMinted',
          userAddress: account,
          tokenId: result.tokenId,
          tokenURI: result.tokenURI,
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      setIsMinting(false);
    }
  };

  const handleList = async (tokenId) => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }
    const price = parseFloat(priceInput.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price greater than 0');
      setPriceInput('');
      closeModal();
      return;
    }

    const priceStr = price.toString();
    const decimalIndex = priceStr.indexOf('.');
    if (decimalIndex !== -1 && priceStr.length - decimalIndex - 1 > 18) {
      toast.error('Price exceeds maximum 18 decimal places');
      setPriceInput('');
      closeModal();
      return;
    }

    closeModal();
    setPriceInput('');
    setIsListing(true);
    try {
      const adjustedPrice = price * 10 ** 18;
      const priceInWei = ethers.parseUnits(adjustedPrice.toFixed(0).toString(), 0);
      const result = await listItem(tokenId, priceInWei.toString());
      if (result) {
        socket.emit('marketplaceEvent', {
          type: 'ItemListed',
          userAddress: account,
          tokenId: tokenId.toString(),
          price: priceInWei.toString(),
          listingId: 'pending',
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      setIsListing(false);
    }
  };

  const openModal = (tokenId) => {
    setSelectedTokenId(tokenId);
  };

  const closeModal = () => {
    setSelectedTokenId(null);
    setPriceInput('');
  };

  if (loading) return <p className="text-center text-gray-400 animate-pulse">Loading NFTs...</p>;
  if (error) return <p className="text-center text-red-400">Error: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handleMint}
          disabled={isMinting}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
        >
          Mint NFT
        </button>
      </div>
      {items.length === 0 && !loading ? (
        <p className="text-center text-gray-500">No NFTs owned.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((nft) => (
            <div key={nft.tokenId} className="bg-gray-700 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <p className="text-gray-300">Token ID: <span className="font-medium">{nft.tokenId}</span></p>
              <p className="text-gray-400 truncate">URI: {nft.tokenURI || 'Loading...'}</p>
              <button
                onClick={() => openModal(nft.tokenId)}
                disabled={isListing}
                className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                List for Sale
              </button>
            </div>
          ))}
        </div>
      )}
      {(isMinting || isListing) && <LoadingOverlay message={`Processing ${isMinting ? 'minting' : 'listing'}...`} />}
      {selectedTokenId && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-gray-950 opacity-50"></div>
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md relative z-10">
            <h3 className="text-lg font-semibold text-blue-300 mb-4">Set Price</h3>
            <input
              type="text"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value.replace('.', ','))}
              placeholder="0,001"
              className="w-full p-2 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-4">
              <button onClick={closeModal} className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg">Cancel</button>
              <button onClick={() => handleList(selectedTokenId)} disabled={isListing} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-lg disabled:opacity-50">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserNFTs;