import UserNFTs from '../components/UserNFTs';
import Marketplace from '../components/Marketplace';
import WalletInfo from '../components/WalletInfo';
import ErrorBoundary from '../components/ErrorBoundary';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { loadUserNFTs } from '../redux/slices/nftSlice';
import { loadListings } from '../redux/slices/listingSlice';

const MarketplacePage = () => {
  const { account } = useSelector((state) => state.wallet);
  const dispatch = useDispatch();

  useEffect(() => {
    if (account) {
      dispatch(loadUserNFTs(account));
      dispatch(loadListings());
    }
  }, [account, dispatch]);

  return (
    <div className="max-w-4xl mx-auto px-4">
      <WalletInfo />
      <div className="mt-10 bg-gray-800 bg-opacity-90 rounded-xl shadow-2xl p-6 border border-gray-700">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-8 text-center">
          NFT Marketplace
        </h2>
        <div className="space-y-10">
          <UserNFTs />
          <Marketplace />
        </div>
      </div>
      <ErrorBoundary />
    </div>
  );
};

export default MarketplacePage;