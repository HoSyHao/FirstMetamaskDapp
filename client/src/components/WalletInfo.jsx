import { useSelector, useDispatch } from 'react-redux';
import { clearWalletInfo } from '../redux/walletSlice';
import useWalletEvents from '../hooks/useWalletEvents';

const WalletInfo = () => {
  const { account, balance, network, message } = useSelector((state) => state.wallet);
  const dispatch = useDispatch();

  useWalletEvents(account);

  const disconnectWallet = () => {
    dispatch(clearWalletInfo());
  };

  return (
    <div className="mt-6 p-6 bg-gray-800 rounded-lg shadow-lg text-white max-w-md mx-auto">
      <h3 className="text-xl font-bold mb-4 text-blue-300">Wallet Info</h3>
      <div className="space-y-2">
        <p className="text-lg">
          <span className="font-semibold text-blue-200">Account:</span>{' '}
          {account ? (
            <span className="text-gray-300 break-all">{account}</span>
          ) : (
            <span className="text-gray-400">Not connected</span>
          )}
        </p>
        <p className="text-lg">
          <span className="font-semibold text-blue-200">Balance:</span>{' '}
          {account ? (
            balance ? (
              <span className="text-gray-300">{balance} tBNB</span>
            ) : (
              <span className="text-gray-400 animate-pulse">Loading...</span>
            )
          ) : (
            <span className="text-gray-400">0 tBNB</span>
          )}
        </p>
        <p className="text-lg">
          <span className="font-semibold text-blue-200">Network:</span>{' '}
          {network ? (
            <span className="text-gray-300">{network}</span>
          ) : (
            <span className="text-gray-400 animate-pulse">Loading...</span>
          )}
        </p>
      </div>
      {account && (
        <button
          onClick={disconnectWallet}
          className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
        >
          Disconnect
        </button>
      )}
      {message && <p className="text-green-400 mt-2">{message}</p>}
    </div>
  );
};

export default WalletInfo;