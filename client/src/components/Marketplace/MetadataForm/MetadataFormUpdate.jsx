import React, { useState, useEffect } from 'react';

const MetadataFormUpdate = ({ metadataInputs, setMetadataInputs, handleMetadataSubmit, setIsMetadataFormOpen, isMinting, selectedNFT }) => {
  const [originalMetadata, setOriginalMetadata] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [attributes, setAttributes] = useState(metadataInputs.nfts[0].attributes || []);

  useEffect(() => {
    setOriginalMetadata({ ...metadataInputs.nfts[0] });
    setAttributes(metadataInputs.nfts[0].attributes || []);
    // Kiểm tra và set imagePreview dựa trên loại dữ liệu
    const image = metadataInputs.nfts[0].image;
    if (image instanceof File) {
      setImagePreview(URL.createObjectURL(image));
    } else if (typeof image === 'string' && image) {
      setImagePreview(image); // Sử dụng URL hiện tại nếu là string
    } else {
      setImagePreview(selectedNFT?.metadata?.image || null); // Dùng ảnh từ selectedNFT nếu không có image mới
    }
  }, [metadataInputs, selectedNFT]);

  const handleInputChange = (field, value) => {
    setMetadataInputs(prev => ({
      ...prev,
      nfts: [{ ...prev.nfts[0], [field]: value }]
    }));
  };

  const handleAttributeChange = (index, field, value) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    setAttributes(newAttributes);
    handleInputChange('attributes', newAttributes);
  };

  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
    handleInputChange('attributes', [...attributes, { trait_type: '', value: '' }]);
  };

  const removeAttribute = (index) => {
    const newAttributes = attributes.filter((_, i) => i !== index);
    setAttributes(newAttributes);
    handleInputChange('attributes', newAttributes);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      handleInputChange('image', file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    handleInputChange('image', null);
  };

  const handleSubmit = () => {
    if (JSON.stringify(metadataInputs.nfts[0]) !== JSON.stringify(originalMetadata)) {
      if (!confirm('You have unsaved changes. Are you sure you want to save?')) return;
    }
    handleMetadataSubmit(originalMetadata);
  };

  const handleCancel = () => {
    if (JSON.stringify(metadataInputs.nfts[0]) !== JSON.stringify(originalMetadata)) {
      if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) return;
    }
    setIsMetadataFormOpen(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-gray-950 opacity-50"></div>
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-2xl relative z-10">
        <h3 className="text-lg font-semibold text-blue-300 mb-4">Update Metadata for NFT #{metadataInputs.nfts[0].tokenId}</h3>
        <div className="flex">
          <div className="w-1/3 mr-6">
            <div className="relative">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-md mb-2" />
              ) : (
                <div className="w-full h-40 bg-gray-700 rounded-md flex items-center justify-center text-gray-400">No Image</div>
              )}
              <input
                type="file"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {imagePreview && (
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center"
                >
                  X
                </button>
              )}
            </div>
          </div>
          <div className="w-2/3">
            <input
              type="text"
              value={metadataInputs.nfts[0].name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Name"
              className="w-full p-2 mb-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={metadataInputs.nfts[0].description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description"
              className="w-full p-2 mb-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mb-2">
              {attributes.map((attr, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    value={attr.trait_type || ''}
                    onChange={(e) => handleAttributeChange(index, 'trait_type', e.target.value)}
                    placeholder="Trait Type"
                    className="w-1/2 p-2 bg-gray-700 text-white border border-gray-600 rounded-lg mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={attr.value || ''}
                    onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="w-1/2 p-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {index > 0 && (
                    <button
                      onClick={() => removeAttribute(index)}
                      className="ml-2 bg-red-600 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      X
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addAttribute}
                className="border border-blue-600 hover:bg-blue-600 text-white py-1 px-2 rounded-lg transition-colors duration-200 mt-2"
              >
                + Add Attribute
              </button>
            </div>
            <div className="flex justify-end gap-4">
              <button onClick={handleCancel} className="border border-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={isMinting} className="border border-blue-600 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50">
                Submit Metadata
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataFormUpdate;