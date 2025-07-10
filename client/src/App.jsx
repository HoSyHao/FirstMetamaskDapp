import { createAppKit } from '@reown/appkit/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { projectId, metadata, networks, ethersAdapter } from './constants/web3ModalConfig';
import { Provider } from 'react-redux';
import store from './redux/store';
import { FaCube, FaStore } from 'react-icons/fa';
import routes from './routes';
import { useState } from 'react';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
          <nav className="fixed w-full bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 animate-gradient-x shadow-lg z-10">
            <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                NFT Hub
              </div>
              {/* Menu cho màn hình lớn */}
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
                  <FaCube className="mr-2" /> TrainingContract
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
              {/* Thanh công cụ cho màn hình nhỏ */}
              <div className="md:hidden flex flex-col items-center w-full">
                <div className="flex justify-between w-full items-center">
                  <div></div> {/* Placeholder để căn giữa appkit-button */}
                  <appkit-button className="mx-auto" />
                  <button
                    onClick={toggleMenu}
                    className="text-gray-300 hover:text-white focus:outline-none p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16m-7 6h7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            {/* Dropdown menu cho màn hình nhỏ - mở từ góc phải với hiệu ứng */}
            {isMenuOpen && (
              <div
                className="md:hidden bg-gray-900/50 rounded-2xl absolute w-48 top-14 right-0 shadow-lg z-20 transition-all duration-300 transform origin-top-right"
                style={{
                  animation: isMenuOpen ? 'slideIn 0.3s ease forwards' : 'slideOut 0.3s ease forwards',
                }}
              >
                <div className="flex flex-col items-end space-y-4 py-4 pr-4">
                  <NavLink
                    to="/contract"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaCube className="mr-2" /> TrainingContract
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
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaStore className="mr-2" /> Marketplace
                  </NavLink>
                </div>
              </div>
            )}
          </nav>
          <div className="pt-20 pb-6">
            <Routes>
              {routes.map((route, index) => (
                <Route
                  key={index}
                  path={route.path}
                  element={route.element}
                >
                  {route.children && route.children.map((child, childIndex) => (
                    <Route
                      key={childIndex}
                      path={child.path}
                      element={child.element}
                    />
                  ))}
                </Route>
              ))}
            </Routes>
          </div>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </Provider>
  );
}

// Animation gradient và slide
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
  @keyframes slideIn {
    from { transform: scaleY(0); opacity: 0; }
    to { transform: scaleY(1); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: scaleY(1); opacity: 1; }
    to { transform: scaleY(0); opacity: 0; }
  }
`;
document.head.appendChild(style);

export default App;