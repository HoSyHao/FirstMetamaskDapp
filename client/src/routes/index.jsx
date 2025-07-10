// src/routes/index.js
import { Navigate } from 'react-router-dom';
import ContractPage from '../pages/ContractPage';
import MarketplacePage from '../pages/MarketplacePage';
import UserNFTs from '../components/Marketplace/UserNFTs';
import MyListings from '../components/Marketplace/MyListings';
import AvailableListing from '../components/Marketplace/AvailableListing';

const routes = [
  {
    path: '/contract',
    element: <ContractPage />,
  },
  {
    path: '/marketplace',
    element: <MarketplacePage />,
    children: [
      { path: '', element: <Navigate to="collection" /> }, // Default to Collection tab
      { path: 'collection', element: <UserNFTs /> },
      { path: 'my-listings', element: <MyListings /> },
      { path: 'available-listings', element: <AvailableListing /> },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/marketplace" />, // Default route
  },
];

export default routes;