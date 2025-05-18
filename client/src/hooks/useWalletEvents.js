import { useEffect } from 'react';
import { ethers } from 'ethers';
import { useDispatch, useSelector } from 'react-redux';
import { setAccountChanged, setNetworkChanged, clearWalletInfo, setWalletInfo } from '../redux/walletSlice';
import { INFURA_BSC_TESTNET_URL } from '../constants/infura';

const useWalletEvents = (account) => {
  const dispatch = useDispatch();
  const { transactions } = useSelector((state) => state.wallet);

  // Khởi tạo Infura provider
  const infuraProvider = new ethers.JsonRpcProvider(INFURA_BSC_TESTNET_URL);

  const fetchWalletInfo = async (address) => {
    if (!address) {
      // Nếu chưa có account, đặt balance là null và network từ Infura
      const networkInfo = await infuraProvider.getNetwork();
      dispatch(
        setWalletInfo({
          account: null,
          balance: null,
          network: networkInfo.name,
          message: 'Connect wallet to view balance',
        })
      );
      return;
    }
    try {
      const balanceWei = await infuraProvider.getBalance(address); // Sử dụng Infura
      const balance = ethers.formatEther(balanceWei);
      const networkInfo = await infuraProvider.getNetwork(); // Sử dụng Infura
      dispatch(
        setWalletInfo({
          account: address,
          balance,
          network: networkInfo.name,
          message: 'Wallet info updated',
        })
      );
    } catch (error) {
      console.error('Error fetching wallet info with Infura:', error);
    }
  };

  useEffect(() => {
    fetchWalletInfo(account); // Gọi ngay cả khi account là null
  }, [account, dispatch]);

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