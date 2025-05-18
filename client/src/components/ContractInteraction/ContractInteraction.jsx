import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useContract from '../../hooks/useContract';
import useContractEvents from '../../hooks/useContractEvents';
import { incrementCounter, deposit, withdraw, resetCounter } from '../../services/contractService';
import CounterInfo from './CounterInfo';
import DepositForm from './DepositForm';
import WithdrawForm from './WithdrawForm';
import TransactionHistory from './TransactionHistory';
import ContractEvents from './ContractEvents';

const ContractInteraction = () => {
  const { account, isLoading, transactions, events, counter, contractBalance, userBalance } = useSelector((state) => state.wallet);
  const dispatch = useDispatch();
  const { contract, provider, owner, updateBalances } = useContract(account);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useContractEvents(contract, updateBalances);

  const handleIncrementCounter = async () => {
    await incrementCounter(contract, account, dispatch);
  };

  const handleDeposit = async () => {
    const success = await deposit(contract, provider, account, depositAmount, dispatch, updateBalances);
    if (success) setDepositAmount('');
  };

  const handleWithdraw = async () => {
    const success = await withdraw(contract, provider, account, withdrawAmount, dispatch, updateBalances);
    if (success) setWithdrawAmount('');
  };

  const handleResetCounter = async () => {
    await resetCounter(contract, account, counter, dispatch);
  };

  return (
    <div className="mt-8 w-full max-w-3xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg text-white relative">
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="text-white text-lg font-semibold flex items-center gap-2">
            <svg
              className="animate-spin h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing transaction...
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-center text-blue-300">Contract Interaction</h2>

      {/* Hiển thị thông tin hợp đồng ngay cả khi chưa kết nối */}
      <CounterInfo
        counter={counter || '0'} // Hiển thị 0 nếu chưa tải
        contractBalance={contractBalance || '0'} // Hiển thị 0 nếu chưa tải
        userBalance={account ? userBalance || '0' : '0'} // 0 nếu chưa kết nối
      />

      {/* Chỉ hiển thị các nút và form khi đã kết nối ví */}
      {account && (
        <>
          <div className="mb-6">
            <button
              onClick={handleIncrementCounter}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50"
            >
              Increment Counter
            </button>
          </div>

          <DepositForm
            depositAmount={depositAmount}
            setDepositAmount={setDepositAmount}
            deposit={handleDeposit}
            isLoading={isLoading}
          />

          <WithdrawForm
            withdrawAmount={withdrawAmount}
            setWithdrawAmount={setWithdrawAmount}
            withdraw={handleWithdraw}
            isLoading={isLoading}
          />

          {account && owner && account.toLowerCase() === owner.toLowerCase() ? (
            <div className="mb-6">
              <button
                onClick={handleResetCounter}
                disabled={isLoading || counter === '0'}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-200 disabled:opacity-50"
              >
                Reset Counter
              </button>
            </div>
          ) : (
            account && owner && (
              <div className="mb-6 text-gray-400 text-sm">Only the contract owner can reset the counter.</div>
            )
          )}

        </>
      )}
      <TransactionHistory transactions={transactions} />
      <ContractEvents events={events} />
      {!account && (
        <div className="text-center text-gray-400 mt-4">
          Connect your wallet to interact with the contract.
        </div>
      )}
    </div>
  );
};

export default ContractInteraction;