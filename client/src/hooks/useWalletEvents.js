import { useEffect } from 'react';
import { ethers } from 'ethers';
import { useDispatch, useSelector } from 'react-redux';
import { setAccountChanged, setNetworkChanged, clearWalletInfo, setWalletInfo } from '../redux/walletSlice';

const useWalletEvents = (account) => {
  const dispatch = useDispatch();
  const { transactions } = useSelector((state) => state.wallet);

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


  useEffect(() => {
    const lastTransaction = transactions[0];
    if (lastTransaction && (lastTransaction.type === 'deposit' || lastTransaction.type === 'withdraw') && lastTransaction.status === 'success') {
      fetchWalletInfo(account);
    }
  }, [transactions, account, dispatch]);

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
};

export default useWalletEvents;