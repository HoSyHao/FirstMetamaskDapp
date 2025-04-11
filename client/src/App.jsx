import ConnectWallet from './components/ConnectWallet';
import WalletInfo from './components/WalletInfo';
import ContractInteraction from './components/ContractInteraction';

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">MetaMask Dapp</h1>
      <ConnectWallet />
      <WalletInfo />
      <ContractInteraction />
    </div>
  );
}

export default App;