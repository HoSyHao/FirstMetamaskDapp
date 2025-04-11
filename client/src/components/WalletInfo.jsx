import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ethers } from 'ethers';
import { setWalletInfo, clearWalletInfo, setAccountChanged, setNetworkChanged } from '../redux/walletSlice';

const WalletInfo = () => {
  const { account, balance, network, message } = useSelector((state) => state.wallet);
  const dispatch = useDispatch();

  const fetchWalletInfo = async (address) => {
    if (!address) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balanceWei = await provider.getBalance(address);
      const balance = ethers.formatEther(balanceWei);
      const networkInfo = await provider.getNetwork();
      dispatch(
        setWalletInfo({
          account: address,
          balance,
          network: networkInfo.name,
          message: 'Wallet info updated',
        })
      );
    } catch (error) {
      console.error('Error fetching wallet info:', error);
    }
  };

  const disconnectWallet = () => {
    dispatch(clearWalletInfo());
  };


  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        dispatch(setAccountChanged(accounts[0]));
        fetchWalletInfo(accounts[0]);
      } else {
        dispatch(clearWalletInfo());
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [dispatch]);


  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const networkInfo = await provider.getNetwork();
        dispatch(setNetworkChanged(networkInfo.name));
        if (account) fetchWalletInfo(account); 
      } catch (error) {
        console.error('Error handling chain changed:', error);
      }
    };

    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [account, dispatch]);

  if (!account) return null;

  return (
    <div className="mt-6 text-center">
      <p className="text-lg font-semibold">
        Account: <span className="text-gray-700">{account}</span>
      </p>
      <p className="text-lg font-semibold">
        Balance: <span className="text-gray-700">{balance ? `${balance} ETH` : 'Loading...'}</span>
      </p>
      <p className="text-lg font-semibold">
        Network: <span className="text-gray-700">{network || 'Loading...'}</span>
      </p>
      <button
        onClick={disconnectWallet}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
      >
        Disconnect
      </button>
      {message && <p className="text-green-600 mt-2">{message}</p>}
    </div>
  );
};

export default WalletInfo;