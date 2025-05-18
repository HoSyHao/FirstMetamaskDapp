import { useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { addEvent } from '../redux/slices/eventsSlice';
import { setCounter } from '../redux/slices/contractSlice';

const useContractEvents = (contract, updateBalances) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!contract) return;

    const handleCounterIncremented = (user, newValue) => {
      console.log('CounterIncremented event:', { user, newValue: newValue.toString() });
      dispatch(
        addEvent({
          type: 'CounterIncremented',
          user,
          newValue: newValue.toString(),
          timestamp: new Date().toISOString(),
        })
      );
      dispatch(setCounter(newValue.toString()));
      toast.success(`Counter incremented to ${newValue}`);
    };

    const handleDeposit = (user, amount) => {
      console.log('Deposit event:', { user, amount: ethers.formatEther(amount) });
      dispatch(
        addEvent({
          type: 'Deposit',
          user,
          amount: ethers.formatEther(amount),
          timestamp: new Date().toISOString(),
        })
      );
      updateBalances();
      toast.success(`Deposited ${ethers.formatEther(amount)} ETH`);
    };

    const handleWithdrawal = (user, amount) => {
      console.log('Withdrawal event:', { user, amount: ethers.formatEther(amount) });
      dispatch(
        addEvent({
          type: 'Withdrawal',
          user,
          amount: ethers.formatEther(amount),
          timestamp: new Date().toISOString(),
        })
      );
      updateBalances();
      toast.success(`Withdrew ${ethers.formatEther(amount)} ETH`);
    };

    contract.on('CounterIncremented', handleCounterIncremented);
    contract.on('Deposit', handleDeposit);
    contract.on('Withdrawal', handleWithdrawal);

    return () => {
      contract.removeAllListeners('CounterIncremented');
      contract.removeAllListeners('Deposit');
      contract.removeAllListeners('Withdrawal');
    };
  }, [contract, dispatch, updateBalances]);
};

export default useContractEvents;