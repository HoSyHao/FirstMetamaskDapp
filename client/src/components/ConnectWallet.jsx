import { useDispatch, useSelector } from 'react-redux';
import { ethers } from 'ethers';
import { setWalletInfo } from '../redux/walletSlice';

const ConnectWallet = () => {
  const dispatch = useDispatch();
  const { account, message } = useSelector((state) => state.wallet);

  const connectMetaMask = async () => {
    if (window.ethereum) {
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
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  if (account) return null;

  return (
    <>

    <button
      onClick={connectMetaMask}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
    >
      Connect MetaMask
    </button>
    {message && <p className="text-red-600 mt-2">{message}</p>}
    </>
  );
};

export default ConnectWallet;