import { useEffect } from 'react';
import { ethers, BrowserProvider } from 'ethers';
import { useDispatch, useSelector } from 'react-redux';
import { setAccountChanged, setNetworkChanged, clearWalletInfo, setWalletInfo, updateBalance } from '../slices/walletSlice';
import { useAppKitAccount, useAppKitNetworkCore, useAppKitProvider } from '@reown/appkit/react';
import { INFURA_BSC_TESTNET_URL } from '../constants/infura';

const useWalletEvents = () => {
  const dispatch = useDispatch();
  const { transactions } = useSelector((state) => state.transactions);
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetworkCore();
  const { walletProvider } = useAppKitProvider('eip155');

  const infuraProvider = new ethers.JsonRpcProvider(INFURA_BSC_TESTNET_URL);

  const fetchWalletInfo = async (address) => {
    if (!address) {
      const networkInfo = await infuraProvider.getNetwork();
      dispatch(setWalletInfo({
        account: null,
        balance: null,
        network: networkInfo.name,
        message: 'Connect wallet to view balance',
      }));
      return;
    }
    try {
      const provider = new BrowserProvider(walletProvider, chainId);
      const balanceWei = await provider.getBalance(address);
      const balance = ethers.formatEther(balanceWei);
      const networkInfo = await provider.getNetwork();
      dispatch(setWalletInfo({
        account: address,
        balance,
        network: networkInfo.name,
        message: 'Wallet info updated',
      }));
      dispatch(updateBalance(balance));
    } catch (error) {
      console.error('Error fetching wallet info:', error);
    }
  };

  useEffect(() => {
    fetchWalletInfo(address);
  }, [address, dispatch, walletProvider, chainId]);

  useEffect(() => {
    const lastTransaction = transactions[0];
    if (lastTransaction && (lastTransaction.type === 'deposit' || lastTransaction.type === 'withdraw') && lastTransaction.status === 'success') {
      fetchWalletInfo(address);
    }
  }, [transactions, address, dispatch]);

  useEffect(() => {
    if (isConnected && address) {
      dispatch(setAccountChanged(address));
    } else {
      dispatch(clearWalletInfo());
    }
  }, [address, isConnected, dispatch]);

  useEffect(() => {
    if (isConnected && chainId) {
      const fetchNetwork = async () => {
        try {
          const provider = new BrowserProvider(walletProvider, chainId);
          const networkInfo = await provider.getNetwork();
          dispatch(setNetworkChanged(networkInfo.name));
          if (address) fetchWalletInfo(address);
        } catch (error) {
          console.error('Error handling chain changed:', error);
        }
      };
      fetchNetwork();
    }
  }, [chainId, isConnected, dispatch, walletProvider, address]);

  return null;
};

export default useWalletEvents;