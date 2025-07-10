// src/pages/MarketplacePage.jsx
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import TransactionHistoryM from '../components/Marketplace/TransactionHistoryM';
import WalletInfo from '../components/WalletInfo';
import ErrorBoundary from '../components/ErrorBoundary';
import { loadUserNFTs } from '../redux/slices/marketplace/nftSlice';
import { loadListings } from '../redux/slices/marketplace/listingSlice';
import { loadUser } from '../redux/slices/marketplace/userSlice';
import { ethers } from 'ethers';

const MarketplacePage = () => {
  const { account } = useSelector((state) => state.wallet);
  const { totalEarnings } = useSelector((state) => state.user || { totalEarnings: '0' });
  const dispatch = useDispatch();

  useEffect(() => {
    if (account) {
      dispatch(loadUserNFTs(account));
      dispatch(loadListings());
      dispatch(loadUser(account));
    }
  }, [account, dispatch]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <WalletInfo />
      <div className="flex flex-col lg:flex-row gap-6 mt-10">
        {/* Phần trái: Tabs và nội dung */}
        <div className="w-full lg:w-3/4 bg-gray-800 bg-opacity-90 rounded-xl shadow-2xl p-6 border border-gray-700">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-8 text-center">
            NFT Marketplace
          </h2>
          <div className="flex space-x-4 mb-6 border-b border-gray-600">
            <NavLink
              to="collection"
              className={({ isActive }) =>
                `px-4 py-2 text-lg font-medium transition-colors duration-200 ${isActive ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`
              }
            >
              Collection
            </NavLink>
            <NavLink
              to="my-listings"
              className={({ isActive }) =>
                `px-4 py-2 text-lg font-medium transition-colors duration-200 ${isActive ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`
              }
            >
              My Listings
            </NavLink>
            <NavLink
              to="available-listings"
              className={({ isActive }) =>
                `px-4 py-2 text-lg font-medium transition-colors duration-200 ${isActive ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`
              }
            >
              Available Listings
            </NavLink>
          </div>
          <div className="mt-4">
            <p className="text-lg text-green-400 mb-4">Total Earnings: {ethers.formatEther(totalEarnings).replace('.', ',')} tBNB</p>
            <Outlet /> {/* Render component con dựa trên route */}
          </div>
        </div>
        {/* Phần phải: Transaction History */}
        <div className="w-full lg:w-1/4 bg-gray-800 bg-opacity-90 rounded-xl shadow-2xl p-6 border border-gray-700 h-fit">
          <TransactionHistoryM />
        </div>
      </div>
      <ErrorBoundary />
    </div>
  );
};

export default MarketplacePage;