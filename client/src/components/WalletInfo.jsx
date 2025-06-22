import { useSelector, useDispatch } from 'react-redux';
import { useAppKitAccount, useAppKitNetworkCore, useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, formatEther } from 'ethers';
import { useEffect } from 'react';
import { setWalletInfo, updateBalance, clearWalletInfo } from '../redux/slices/walletSlice';

const WalletInfo = () => {
  const dispatch = useDispatch();
  const { account, balance, network, message } = useSelector((state) => state.wallet);
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetworkCore();
  const { walletProvider } = useAppKitProvider('eip155');

  const updateWalletInfo = async () => {
    if (isConnected && address && walletProvider) {
      try {
        const provider = new BrowserProvider(walletProvider, chainId);
        const balanceWei = await provider.getBalance(address);
        const balance = formatEther(balanceWei);
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
        dispatch(setWalletInfo({
          account: address,
          balance: null,
          network: network,
          message: 'Error fetching balance',
        }));
      }
    } else {
      dispatch(clearWalletInfo());
    }
  };

  useEffect(() => {
    updateWalletInfo();
  }, [isConnected, address, chainId, walletProvider, dispatch]);

  return (
    <div className="bg-gray-800 bg-opacity-90 rounded-xl shadow-2xl p-6 mt-6 max-w-2xs mx-auto justify-items-center">
      <h3 className="text-xl font-bold text-blue-300 mb-4">Wallet Info</h3>
      <div className="space-y-3">
        <p className="text-gray-300">
          <span className="font-semibold text-blue-200">Account:</span>{' '}
          {address ? (
            <span className="text-gray-400 break-all">{address.slice(0, 6)}...{address.slice(-4)}</span>
          ) : (
            <span className="text-gray-500">Not connected</span>
          )}
        </p>
        <p className="text-gray-300">
          <span className="font-semibold text-blue-200">Balance:</span>{' '}
          {balance ? (
            <span className="text-gray-400">{balance.slice(0, 6)} tBNB</span>
          ) : (
            <span className="text-gray-500 animate-pulse">Loading...</span>
          )}
        </p>
        <p className="text-gray-300">
          <span className="font-semibold text-blue-200">Network:</span>{' '}
          {network ? (
            <span className="text-gray-400">{network}</span>
          ) : (
            <span className="text-gray-500 animate-pulse">Loading...</span>
          )}
        </p>
      </div>
      {message && <p className="text-green-400 mt-2 text-sm">{message}</p>}
    </div>
  );
};

export default WalletInfo;