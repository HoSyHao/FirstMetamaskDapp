import { useSelector } from 'react-redux';

const Marketplace = () => {
  const { items, loading, error } = useSelector((state) => state.listings);

  if (loading) return <p className="text-center text-gray-400 animate-pulse">Loading listings...</p>;
  if (error) return <p className="text-center text-red-400">Error: {error}</p>;

  return (
    <div>
      <h3 className="text-xl font-semibold text-blue-300 mb-4">Available Listings</h3>
      {items.length === 0 ? (
        <p className="text-center text-gray-500">No listings available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(listing => (
            <div key={listing.id} className="bg-gray-700 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
              <p className="text-gray-300">Token ID: <span className="font-medium">{listing.tokenId}</span></p>
              <p className="text-gray-400">Price: {(listing.price / 10**18).toFixed(4)} tBNB</p>
              <button className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors duration-200">
                Buy
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;