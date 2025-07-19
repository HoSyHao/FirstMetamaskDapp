import { useDispatch, useSelector } from 'react-redux';
import { useAppKitAccount } from '@reown/appkit/react';
import useMarketplace from '../../hooks/useMarketplace';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import LoadingOverlay from '../LoadingOverlay';
import { ethers } from 'ethers';
import { addNFT, removeNFT, loadUserNFTs, resetItems } from '../../redux/slices/marketplace/nftSlice';
import { socket } from '../../lib/socketClient';
import { addListing, removeListing } from '../../redux/slices/marketplace/listingSlice';
import Pagination from '../Pagination';
import MetadataFormUpdate from './MetadataForm/MetadataFormUpdate';
import { apiClient } from '../../lib/apiClient';
import { API_ENDPOINTS } from '../../constants/api';
import MetadataFormSingle from './MetadataForm/MetadataFormSingle';
import MetadataFormMulti from './MetadataForm/MetadataFormMulti';
import NFTDetail from './NFTDetail';

const UserNFTs = () => {
  const { items, total, loading, error } = useSelector((state) => state.nfts);
  const dispatch = useDispatch();
  const { address: account } = useAppKitAccount();
  const { mintNFT, listItem } = useMarketplace(account);
  const [isMinting, setIsMinting] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // Đảm bảo bắt đầu từ trang 1
  const [isMetadataFormOpen, setIsMetadataFormOpen] = useState(false);
  const [metadataInputs, setMetadataInputs] = useState({ quantity: 1, nfts: [{}] });
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  const itemsPerPage = 12;

  // Reset state và load trang 1 mỗi khi component được render hoặc route thay đổi
  useEffect(() => {
    dispatch(resetItems());
    setCurrentPage(1);
    if (account) {
      const normalizedAddress = account.toLowerCase();
      socket.emit('subscribe', { userAddress: normalizedAddress });
      loadInitialData(normalizedAddress); // Sử dụng hàm mới để load ban đầu
    }
  }, [dispatch, account]);

  // Cập nhật dữ liệu khi currentPage thay đổi
  useEffect(() => {  
    if (account) {
      const normalizedAddress = account.toLowerCase();
      loadPagesSequentially(normalizedAddress, currentPage);
    }
  }, [account, currentPage, dispatch, items.length, total]);

  const loadUserNFTsData = async (userAddress, page) => {
    const normalizedAddress = userAddress.toLowerCase();
    try {
      const result = await dispatch(loadUserNFTs({ userAddress: normalizedAddress, page, limit: itemsPerPage })).unwrap();
      return result?.length || 0; // Trả về số lượng item để kiểm tra
    } catch (error) {
      console.error(`Failed to load page ${page} for user ${normalizedAddress}:`, error);
      toast.error(`Failed to load NFTs: ${error.message || 'Unknown error'}`);
      return 0;
    }
  };

  const loadInitialData = async (userAddress) => {
    const normalizedAddress = userAddress.toLowerCase();
    const itemCount = await loadUserNFTsData(normalizedAddress, 1);
    if (itemCount === 0 && total > 0) {
      await loadUserNFTsData(normalizedAddress, 1); // Thử load lại
    }
  };

  const loadAllUserNFTs = async (userAddress) => {
    const normalizedAddress = userAddress.toLowerCase();
    try {
      const totalPages = Math.ceil(total / itemsPerPage) || 1;
      dispatch(resetItems());
      for (let page = 1; page <= totalPages; page++) {
        await loadUserNFTsData(normalizedAddress, page);
      }
    } catch (error) {
      console.error('Failed to load all NFTs:', error);
      toast.error(`Failed to load all NFTs: ${error.message || 'Unknown error'}`);
    }
  };

  const loadPagesSequentially = async (userAddress, targetPage) => {
    const normalizedAddress = userAddress.toLowerCase();
    const currentLoadedPage = Math.floor((items.length - 1) / itemsPerPage) + 1 || 1;
    const maxPages = Math.ceil(total / itemsPerPage) || 1;
    for (let page = currentLoadedPage; page <= Math.min(targetPage, maxPages); page++) {
      await loadUserNFTsData(normalizedAddress, page);
    }
  };

  useEffect(() => {
    const handleMarketplaceUpdate = (data) => {
      const { type, tokenId, tokenURI, listingId, buyerTokenURI, userAddress, seller, metadata } = data;
      if (type === 'ListingCancelled' && listingId) {
        dispatch(removeListing(listingId));
      } else if (type === 'ItemSold' && data.userAddress.toLowerCase() === account?.toLowerCase()) {
        dispatch(addNFT({ tokenId, tokenURI: buyerTokenURI || tokenURI || 'Loading...', timestamp: new Date().toISOString() }));
      } else if (type === 'ItemSold' && seller && seller.toLowerCase() === account?.toLowerCase()) {
        dispatch(removeListing(listingId));
        dispatch(loadUserNFTs({ userAddress: account, page: 1, limit: itemsPerPage }));
        toast.success('🎉 Your NFT has been sold! Check your earnings.');
      } else if (type === 'ItemListed' && tokenId === selectedTokenId && userAddress.toLowerCase() === account?.toLowerCase()) {
        dispatch(removeNFT(tokenId));
      } else if (type === 'ItemListed' && listingId && listingId !== 'pending' && userAddress.toLowerCase() !== account?.toLowerCase()) {
        dispatch(addListing({ id: listingId, tokenId: data.tokenId, price: data.price, seller: userAddress, timestamp: new Date().toISOString() }));
      } else if (type === 'MetadataUpdated' || type === 'MetadataAdded') {
        if (userAddress.toLowerCase() === account?.toLowerCase()) {
          loadAllUserNFTs(account);
          toast.success(`NFT metadata ${type === 'MetadataUpdated' ? 'updated' : 'added'} successfully!`);
        }
      }
    };
    socket.on('marketplaceUpdate', handleMarketplaceUpdate);
    return () => socket.off('marketplaceUpdate', handleMarketplaceUpdate);
  }, [account, dispatch, selectedTokenId, total]);

  const handleMint = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }
    if (metadataInputs.quantity > 3) {
      toast.error('Maximum 3 NFTs can be minted at once');
      return;
    }
    setIsMinting(true);
    try {
      const quantity = metadataInputs.quantity || 1;
      const result = await mintNFT(quantity, account, dispatch, () => {});
      if (result) {
        const { tokenIds } = result;
        const newNFTs = tokenIds.map((tokenId, i) => ({
          tokenId,
          name: '',
          image: null,
          attributes: [],
        }));
        setMetadataInputs(prev => ({ ...prev, nfts: newNFTs }));
        setIsMetadataFormOpen(true);
        setIsUpdateMode(false);
        socket.emit('marketplaceEvent', {
          type: 'NFTMinted',
          userAddress: account,
          tokenIds: tokenIds,
          timestamp: new Date().toISOString(),
        });
        if (quantity === 1) {
          if (!confirm('You are minting without adding metadata. Continue?')) {
            setIsMetadataFormOpen(false);
            return;
          }
        }
      }
    } finally {
      setIsMinting(false);
    }
  };

  const handleAddMetadataSubmit = async () => {
    setIsMinting(true);
    try {
      const formData = new FormData();
      const nftData = metadataInputs.nfts.map(nft => ({
        tokenId: nft.tokenId,
        name: nft.name || '',
        description: nft.description || '',
        attributes: nft.attributes || [],
      }));
      formData.append('nftData', JSON.stringify(nftData));

      metadataInputs.nfts.forEach((nft, index) => {
        if (nft.image instanceof File) {
          formData.append('images', nft.image);
        } else if (!nft.image) {
          toast.error(`Image is required for NFT with Token ID ${nft.tokenId}`);
          setIsMinting(false);
          return;
        }
      });

      console.log('FormData entries for add:', Array.from(formData.entries()));

      const response = await apiClient.post(API_ENDPOINTS.MINT_METADATA, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;
      if (data.success) {
        setIsMetadataFormOpen(false);
        if (account) {
          socket.emit('marketplaceEvent', {
            type: 'MetadataAdded',
            userAddress: account,
            tokenId: metadataInputs.nfts[0].tokenId,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        toast.error(`Failed to process metadata: ${data.error}`);
      }
    } catch (error) {
      console.error('Mint metadata submission error:', error.response?.data || error);
      toast.error(`Failed to submit metadata: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  const handleUpdateMetadataSubmit = async (originalMetadata = null) => {
    setIsMinting(true);
    try {
      const nft = metadataInputs.nfts[0];
      const imageFile = nft.image;

      if (!imageFile) {
        const response = await apiClient.put(API_ENDPOINTS.UPDATE_NFT_METADATA(nft.tokenId), {
          name: nft.name || '',
          description: nft.description || '',
          attributes: nft.attributes || [],
        }, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.data.success) {
          setIsMetadataFormOpen(false);
          if (account) {
            socket.emit('marketplaceEvent', {
              type: 'MetadataUpdated',
              userAddress: account,
              tokenId: nft.tokenId,
              timestamp: new Date().toISOString(),
            });
          }
          return;
        }
      }

      const formData = new FormData();
      formData.append('name', nft.name || '');
      formData.append('description', nft.description || '');
      if (nft.attributes && nft.attributes.length > 0) {
        nft.attributes.forEach((attr, index) => {
          formData.append(`attributes[${index}][trait_type]`, attr.trait_type || '');
          formData.append(`attributes[${index}][value]`, attr.value || '');
        });
      }
      if (imageFile instanceof File) {
        formData.append('image', imageFile);
      }

      const response = await apiClient.put(API_ENDPOINTS.UPDATE_NFT_METADATA(nft.tokenId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;
      if (data.success) {
        setIsMetadataFormOpen(false);
        if (account) {
          socket.emit('marketplaceEvent', {
            type: 'MetadataUpdated',
            userAddress: account,
            tokenId: nft.tokenId,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        toast.error(`Failed to update metadata: ${data.error}`);
      }
    } catch (error) {
      console.error('Update metadata submission error:', error.response?.data || error);
      toast.error(`Failed to update metadata: ${error.response?.data?.error || error.message}`);
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
      const result = await listItem(tokenId, priceInWei.toString(), account, dispatch, () => {});
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
      closeDetail();
    }
  };

  const openModal = (tokenId) => {
    setSelectedTokenId(tokenId);
  };

  const closeModal = () => {
    setSelectedTokenId(null);
    setPriceInput('');
  };

  const openDetail = (nft) => {
    setSelectedNFT(nft);
  };

  const closeDetail = () => {
    setSelectedNFT(null);
  };

  if (loading && currentPage === 1) return <p className="text-center text-gray-400 animate-pulse">Loading NFTs...</p>;
  if (error) return <p className="text-center text-red-400">Error: {error}</p>;

  const sortedItems = [...items].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const totalPages = Math.ceil(total / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

  const isMetadataInvalid = (metadata) => {
    if (!metadata || metadata === null || metadata === undefined) return true;
    if (metadata.error && Object.keys(metadata).length === 2 && metadata.tokenId) return true;
    return !metadata.name || !metadata.image || !metadata.attributes;
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <input
            type="number"
            value={metadataInputs.quantity}
            onChange={(e) => setMetadataInputs(prev => ({ ...prev, quantity: Math.min(parseInt(e.target.value) || 1, 3) }))}
            min="1"
            max="3"
            className="no-spinner p-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Quantity (max 3)"
          />
          <button
            onClick={handleMint}
            disabled={isMinting}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            Mint NFT
          </button>
        </div>
      </div>
      {isMetadataFormOpen && !isUpdateMode && metadataInputs.nfts.length === 1 && (
        <MetadataFormSingle
          metadataInputs={metadataInputs}
          setMetadataInputs={setMetadataInputs}
          handleMetadataSubmit={handleAddMetadataSubmit}
          setIsMetadataFormOpen={setIsMetadataFormOpen}
          isMinting={isMinting}
        />
      )}
      {isMetadataFormOpen && !isUpdateMode && metadataInputs.nfts.length > 1 && (
        <MetadataFormMulti
          metadataInputs={metadataInputs}
          setMetadataInputs={setMetadataInputs}
          handleMetadataSubmit={handleAddMetadataSubmit}
          setIsMetadataFormOpen={setIsMetadataFormOpen}
          isMinting={isMinting}
        />
      )}
      {isMetadataFormOpen && isUpdateMode && metadataInputs.nfts.length === 1 && (
        <MetadataFormUpdate
          metadataInputs={metadataInputs}
          setMetadataInputs={setMetadataInputs}
          handleMetadataSubmit={handleUpdateMetadataSubmit}
          setIsMetadataFormOpen={setIsMetadataFormOpen}
          isMinting={isMinting}
          selectedNFT={selectedNFT}
        />
      )}
      {loading && currentPage > 1 ? (
        <p className="text-center text-gray-400 animate-pulse">Loading NFTs...</p>
      ) : displayedItems.length === 0 ? (
        <p className="text-center text-gray-500">No NFTs owned. Total expected: {total}</p> // Hiển thị total để debug
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" style={{ maxHeight: '60vh', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#4a5568 transparent' }}>
            {displayedItems.map((nft) => (
              <div key={nft.tokenId} className="bg-gray-700 rounded-lg p-4 shadow-md relative cursor-pointer" onClick={() => openDetail(nft)}>
                {nft.metadata?.image && <img src={nft.metadata.image} alt={nft.metadata.name} className="w-full h-40 object-cover rounded-md mb-2" />}
                <h3 className="text-white text-center">{nft.metadata?.name || 'Unnamed NFT'}</h3>
                <p className="text-gray-400 text-center">#{nft.tokenId}</p>
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
      {selectedNFT && (
        <NFTDetail
          nft={selectedNFT}
          isListing={isListing}
          isMetadataInvalid={() => isMetadataInvalid(selectedNFT.metadata)}
          openModal={openModal}
          setIsMetadataFormOpen={setIsMetadataFormOpen}
          setMetadataInputs={setMetadataInputs}
          setIsUpdateMode={setIsUpdateMode}
          closeDetail={closeDetail}
          handleCancel={() => {}}
          handleBuy={() => {}}
          fromMyListings={false}
        />
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
              <button onClick={closeModal} className="border border-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg">Cancel</button>
              <button onClick={() => handleList(selectedTokenId)} disabled={isListing} className="border border-blue-600 hover:bg-blue-600 text-white py-2 px-4 rounded-lg disabled:opacity-50">
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