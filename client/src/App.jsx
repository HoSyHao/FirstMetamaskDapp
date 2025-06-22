import { createAppKit } from '@reown/appkit/react';
import { bscTestnet } from '@reown/appkit/networks';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Route, Routes, NavLink } from 'react-router-dom';
import { projectId, metadata, networks, ethersAdapter } from './constants/web3ModalConfig';
import ContractPage from './pages/ContractPage';
import MarketplacePage from './pages/MarketplacePage';
import { Provider } from 'react-redux';
import store from './redux/store';
import { FaCube, FaStore } from 'react-icons/fa';

createAppKit({
  adapters: [ethersAdapter],
  networks,
  metadata,
  projectId,
  themeMode: 'dark',
  features: { analytics: true },
  themeVariables: { "--w3m-color-mix": "#000000", "--w3m-color-mix-strength": 40 },
});

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
          <nav className="fixed w-full bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 animate-gradient-x shadow-lg z-10">
            <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                NFT Hub
              </div>
              <div className="hidden md:flex space-x-6">
                <NavLink
                  to="/contract"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <FaCube className="mr-2" /> Contract
                </NavLink>
                <NavLink
                  to="/marketplace"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <FaStore className="mr-2" /> Marketplace
                </NavLink>
                <appkit-button />
              </div>
              <div className="md:hidden">
                {/* Menu burger cho mobile (cần thêm logic toggle) */}
                <button className="text-gray-300 hover:text-white focus:outline-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </button>
              </div>
            </div>
          </nav>
          <div className="pt-20 pb-6">
            <Routes>
              <Route path="/contract" element={<ContractPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/" element={<MarketplacePage />} />
            </Routes>
          </div>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </Provider>
  );
}

// Animation gradient
const style = document.createElement('style');
style.innerHTML = `
  @keyframes gradientAnimation {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradientAnimation 10s ease infinite;
  }
`;
document.head.appendChild(style);

export default App;