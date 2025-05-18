import { createAppKit } from '@reown/appkit/react';
import { mainnet, bscTestnet, arbitrum, sepolia } from '@reown/appkit/networks';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import WalletInfo from './components/WalletInfo';
import ContractInteraction from './components/ContractInteraction/ContractInteraction';
import { projectId, metadata, networks, ethersAdapter } from './constants/web3ModalConfig';
import ErrorBoundary from './components/ErrorBoundary';

createAppKit({
  adapters: [ethersAdapter],
  networks,
  metadata,
  projectId,
  themeMode: 'dark',
  features: {
    analytics: true,
  },
  themeVariables: {
    "--w3m-color-mix": "#000000",
    "--w3m-color-mix-strength": 40,
  },
});

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-950">
      <h1 className="text-3xl font-bold my-6 text-blue-600">Multi-Wallet Dapp</h1>
      <appkit-button />
      <WalletInfo />
      <ContractInteraction />
      <ToastContainer position="top-right" autoClose={3000} />
      <ErrorBoundary />
    </div>
  );
}

export default App;