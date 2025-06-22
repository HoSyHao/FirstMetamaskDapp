import { useSelector } from 'react-redux';

const UserNFTs = () => {
  const { items, loading, error } = useSelector((state) => state.nfts);

  if (loading) return <p className="text-center text-gray-400 animate-pulse">Loading NFTs...</p>;
  if (error) {
    if (error === 'User not found') {
      return (
        <p className="text-center text-yellow-400">
          No NFTs found for this wallet. Please mint or check your wallet address.
        </p>
      );
    }
    return <p className="text-center text-red-400">Error: {error}. Please try again later or contact support.</p>;
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-blue-300 mb-4">Your NFTs</h3>
      {items.length === 0 ? (
        <p className="text-center text-gray-500">No NFTs owned.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(nft => (
            <div key={nft.id} className="bg-gray-700 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <p className="text-gray-300">Token ID: <span className="font-medium">{nft.tokenId}</span></p>
              <p className="text-gray-400 truncate">URI: {nft.tokenURI}</p>
              <button className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 rounded-lg transition-colors duration-200">
                List for Sale
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserNFTs;