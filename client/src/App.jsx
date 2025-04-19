import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConnectWallet from './components/ConnectWallet';
import WalletInfo from './components/WalletInfo';
import ContractInteraction from './components/ContractInteraction/ContractInteraction';

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-950 ">
      <h1 className="text-3xl font-bold my-6 text-blue-600">MetaMask Dapp</h1>
      <ConnectWallet />
      <WalletInfo />
      <ContractInteraction />
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default App;