import { useState } from 'react'; 
import { useDispatch, useSelector } from 'react-redux';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { setWalletInfo } from '../redux/walletSlice';

const ConnectWallet = () => {
  const dispatch = useDispatch();
  const { account, message } = useSelector((state) => state.wallet);
  const [isConnecting, setIsConnecting] = useState(false); 

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask!'); 
      return;
    }

    setIsConnecting(true); 
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balanceWei = await provider.getBalance(account);
      const balance = ethers.formatEther(balanceWei);
      const network = await provider.getNetwork();

      dispatch(
        setWalletInfo({
          account,
          balance,
          network: network.name,
          message: 'Connected successfully!',
        })
      );
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      toast.error('Failed to connect to MetaMask: ' + (error.message || 'Unknown error'));
    } finally {
      setIsConnecting(false); 
    }
  };

  if (account) return null;

  return (
    <div className="flex flex-col items-center justify-center">
      <button
        onClick={connectMetaMask}
        disabled={isConnecting}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-lg font-semibold disabled:opacity-50"
      >
        {isConnecting ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Connecting...
          </span>
        ) : (
          'Connect MetaMask'
        )}
      </button>
      {message && <p className="text-red-400 mt-2">{message}</p>}
    </div>
  );
};

export default ConnectWallet;