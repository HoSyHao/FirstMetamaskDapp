import React, { useState, useEffect } from 'react';

const MetadataFormMulti = ({ metadataInputs, setMetadataInputs, handleMetadataSubmit, setIsMetadataFormOpen, isMinting }) => {
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    const previews = metadataInputs.nfts.map(nft => 
      nft.image ? URL.createObjectURL(nft.image) : (nft.metadata?.image || null)
    );
    setImagePreviews(previews);
  }, [metadataInputs]);

  const handleInputChange = (index, field, value) => {
    setMetadataInputs(prev => ({
      ...prev,
      nfts: prev.nfts.map((nft, i) => i === index ? { ...nft, [field]: value } : nft)
    }));
  };

  const handleAttributeChange = (nftIndex, attrIndex, field, value) => {
    const newNFTs = [...metadataInputs.nfts];
    newNFTs[nftIndex].attributes[attrIndex] = { ...newNFTs[nftIndex].attributes[attrIndex], [field]: value };
    setMetadataInputs(prev => ({ ...prev, nfts: newNFTs }));
  };

  const addAttribute = (nftIndex) => {
    const newNFTs = [...metadataInputs.nfts];
    newNFTs[nftIndex].attributes = [...newNFTs[nftIndex].attributes, { trait_type: '', value: '' }];
    setMetadataInputs(prev => ({ ...prev, nfts: newNFTs }));
  };

  const removeAttribute = (nftIndex, attrIndex) => {
    const newNFTs = [...metadataInputs.nfts];
    newNFTs[nftIndex].attributes = newNFTs[nftIndex].attributes.filter((_, i) => i !== attrIndex);
    setMetadataInputs(prev => ({ ...prev, nfts: newNFTs }));
  };

  const handleImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const newPreviews = [...imagePreviews];
      newPreviews[index] = URL.createObjectURL(file);
      setImagePreviews(newPreviews);
      handleInputChange(index, 'image', file);
    }
  };

  const handleRemoveImage = (index) => {
    const newPreviews = [...imagePreviews];
    newPreviews[index] = null;
    setImagePreviews(newPreviews);
    handleInputChange(index, 'image', null);
  };

  const handleSubmit = () => {
    handleMetadataSubmit();
  };

  const handleCancel = () => {
    if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) return;
    setIsMetadataFormOpen(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-gray-950 opacity-50"></div>
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-5xl relative z-10">
        <h3 className="text-lg font-semibold text-blue-300 mb-4">Enter Metadata for Minted NFTs</h3>
        <div className="flex space-x-4 overflow-x-auto max-h-98 " style={{ maxHeight: '80vh',  overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#4a5568 transparent' }}>
          {metadataInputs.nfts.map((nft, index) => (
            <div key={index} className="min-w-[300px] h-auto bg-gray-800 p-4 rounded-lg">
              <p className="text-gray-300 mb-2">Token ID: #{nft.tokenId}</p>
              <div className="relative mb-2">
                {imagePreviews[index] ? (
                  <img src={imagePreviews[index]} alt={`Preview ${index}`} className="w-full h-40 object-cover rounded-md" />
                ) : (
                  <div className="w-full h-40 bg-gray-700 rounded-md flex items-center justify-center text-gray-400">No Image</div>
                )}
                <input
                  type="file"
                  onChange={(e) => handleImageChange(index, e)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {imagePreviews[index] && (
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    X
                  </button>
                )}
              </div>
              <input
                type="text"
                value={nft.name || ''}
                onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                placeholder="Name"
                className="w-full p-2 mb-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={nft.description || ''}
                onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                placeholder="Description"
                className="w-full p-2 mb-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mb-2">
                {nft.attributes.map((attr, attrIndex) => (
                  <div key={attrIndex} className="flex mb-2">
                    <input
                      type="text"
                      value={attr.trait_type || ''}
                      onChange={(e) => handleAttributeChange(index, attrIndex, 'trait_type', e.target.value)}
                      placeholder="Trait Type"
                      className="w-1/2 p-2 bg-gray-700 text-white border border-gray-600 rounded-lg mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={attr.value || ''}
                      onChange={(e) => handleAttributeChange(index, attrIndex, 'value', e.target.value)}
                      placeholder="Value"
                      className="w-1/2 p-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {attrIndex > 0 && (
                      <button
                        onClick={() => removeAttribute(index, attrIndex)}
                        className="ml-2 bg-red-600 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        X
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addAttribute(index)}
                  className="border border-blue-600 hover:bg-blue-600 text-white py-1 px-2 rounded-lg transition-colors duration-200 mt-2"
                >
                  + Add Attribute
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <button onClick={handleCancel} className="border border-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isMinting} className="border border-blue-600 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50">
            Submit Metadata
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetadataFormMulti;