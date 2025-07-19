import React from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { ethers } from 'ethers';

const NFTDetail = ({ nft, isListing, isMetadataInvalid, openModal, setIsMetadataFormOpen, setMetadataInputs, setIsUpdateMode, closeDetail, handleCancel, handleBuy, fromMyListings }) => {
  const { address: account } = useAppKitAccount();
  const isOwner = account?.toLowerCase() === nft.seller?.toLowerCase();

  const handleAddMetadata = () => {
    setMetadataInputs({ quantity: 1, nfts: [{ tokenId: nft.tokenId, name: '', image: null, attributes: [] }] });
    setIsMetadataFormOpen(true);
    setIsUpdateMode(false);
    closeDetail();
  };

  const handleUpdateMetadata = () => {
    setMetadataInputs({ quantity: 1, nfts: [{ tokenId: nft.tokenId, ...nft.metadata }] });
    setIsMetadataFormOpen(true);
    setIsUpdateMode(true);
    closeDetail();
  };

  // Kiểm tra xem nft có phải từ listing không
  const isFromListing = nft.price !== undefined && nft.seller !== undefined && nft.listingId !== undefined;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-gray-950 opacity-50" onClick={closeDetail}></div>
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-4xl relative z-10 flex">
        {nft.metadata?.image && (
          <img src={nft.metadata.image} alt={nft.metadata.name || 'Unnamed NFT'} className="w-1/3 h-auto object-cover mr-6 rounded-md" />
        )}
        <div className="w-2/3">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">{nft.metadata?.name || 'Unnamed NFT'}</h3>
          <p className="text-gray-300">Token ID: #{nft.tokenId}</p>
          <p className="text-gray-300">Description: {nft.metadata?.description}</p>
          <div>
            <h4 className="text-white mb-2">Attributes:</h4>
            {nft.metadata?.attributes?.map((attr, index) => (
              <p key={index} className="text-gray-300">
                {attr.trait_type}: {attr.value}
              </p>
            ))}
          </div>
          {isFromListing && (
            <div>
              <h4 className="text-white mb-2">Blockchain Info:</h4>
              <p className="text-gray-300">Listing ID: {nft.listingId}</p>
              <p className="text-gray-300">Price: {nft.price ? ethers.formatEther(nft.price).replace('.', ',') : 'N/A'} tBNB</p>
              <p className="text-gray-500">Seller: {nft.seller?.slice(0, 6)}...{nft.seller?.slice(-4)}</p>
            </div>
          )}
          <div className="mt-4 space-x-2">
            {!isFromListing && isMetadataInvalid() && ( // Chỉ hiển thị Add Metadata khi không phải từ listing và metadata thiếu
              <button
                onClick={handleAddMetadata}
                className="border border-gray-600 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Add Metadata
              </button>
            )}
            {!isFromListing && !isMetadataInvalid() && ( // Chỉ hiển thị Update Metadata và List khi không phải từ listing và metadata hợp lệ
              <>
                <button
                  onClick={handleUpdateMetadata}
                  className="border border-gray-600 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 mr-1"
                >
                  Update Metadata
                </button>
                <button
                  onClick={() => openModal(nft.tokenId)}
                  disabled={isListing}
                  className="border border-gray-600 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  List
                </button>
              </>
            )}
            {fromMyListings && isFromListing && isOwner && (
              <button
                onClick={() => handleCancel(nft.listingId)}
                disabled={isListing}
                className="border border-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            )}
            {!fromMyListings && isFromListing && !isOwner && (
              <button
                onClick={() => handleBuy(nft.listingId)}
                disabled={isListing}
                className="border border-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Buy
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTDetail;