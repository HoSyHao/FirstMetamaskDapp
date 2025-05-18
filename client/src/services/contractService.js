import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { contractAddress, BSC_TESTNET_CHAIN_ID } from '../constants/contract';
import {
  addTransaction,
  updateTransaction,
} from '../redux/slices/transactionsSlice';
import { addEvent } from '../redux/slices/eventsSlice';
import { setCounter, setLoading } from '../redux/slices/contractSlice';

export const incrementCounter = async (contract, account, dispatch) => {
  if (!contract) {
    toast.error('Contract not initialized');
    return;
  }
  dispatch(setLoading(true));
  try {
    const tx = await contract.incrementCounter();
    dispatch(
      addTransaction({
        hash: tx.hash,
        type: 'incrementCounter',
        from: account,
        timestamp: new Date().toISOString(),
        status: 'pending',
      })
    );
    await tx.wait();
    dispatch(
      updateTransaction({
        hash: tx.hash,
        status: 'success',
      })
    );
    const newCounter = await contract.counter();
    dispatch(setCounter(newCounter.toString()));
    dispatch(
      addEvent({
        type: 'CounterIncremented',
        user: account,
        newValue: newCounter.toString(),
        timestamp: new Date().toISOString(),
      })
    );
    return newCounter.toString();
  } catch (error) {
    console.error('Error incrementing counter:', error);
    if (error.code !== 'ACTION_REJECTED') {
      dispatch(
        addTransaction({
          hash: error.transactionHash || 'unknown',
          type: 'incrementCounter',
          from: account,
          timestamp: new Date().toISOString(),
          status: 'failed',
        })
      );
    }
    let errorMessage = 'Failed to increment counter: Unknown error';
    if (error.code === 'ACTION_REJECTED') {
      errorMessage = 'Transaction rejected by user';
    } else {
      errorMessage = error.reason || 'Failed to increment counter: ' + (error.message || 'Unknown error');
    }
    toast.error(errorMessage);
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const deposit = async (contract, provider, account, depositAmount, dispatch, updateBalances) => {
    if (!contract || !provider) {
      toast.error('Contract not initialized');
      return;
    }
    if (!depositAmount || isNaN(depositAmount) || depositAmount <= 0) {
      toast.error('Please enter a valid deposit amount');
      return;
    }
  
    try {
      const network = await provider.getNetwork();
      if (network.chainId.toString(16) !== BSC_TESTNET_CHAIN_ID.slice(2)) {
        toast.error('Please switch to BSC Testnet');
        return;
      }
    } catch (error) {
      console.error('Error checking network:', error);
      toast.error('Failed to verify network: ' + (error.message || 'Unknown error'));
      return;
    }
  
    dispatch(setLoading(true));
    let txHash;
    try {
      const tx = await contract.deposit({
        value: ethers.parseEther(depositAmount),
        gasLimit: 100000,
      });
      txHash = tx.hash;
      dispatch(
        addTransaction({
          hash: tx.hash,
          type: 'deposit',
          from: account,
          value: depositAmount,
          timestamp: new Date().toISOString(),
          status: 'pending',
        })
      );
      await tx.wait();
      dispatch(
        updateTransaction({
          hash: tx.hash,
          status: 'success',
        })
      );
      await updateBalances();
      dispatch(
        addEvent({
          type: 'Deposit',
          user: account,
          amount: depositAmount,
          timestamp: new Date().toISOString(),
        })
      );
      toast.success('Deposit successful!');
      return true;
    } catch (error) {
      console.error('Error depositing:', error);
      if (error.code !== 'ACTION_REJECTED') {
        dispatch(
          updateTransaction({
            hash: txHash || 'unknown',
            type: 'deposit',
            from: account,
            value: depositAmount,
            timestamp: new Date().toISOString(),
            status: 'failed',
          })
        );
      }
      let errorMessage = 'Failed to deposit: Unknown error';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.code === 'CALL_EXCEPTION' && !error.reason) {
        errorMessage = 'Deposit failed: Contract may not support this action';
      } else {
        errorMessage = error.reason || 'Failed to deposit: ' + (error.message || 'Unknown error');
      }
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  export const withdraw = async (contract, provider, account, withdrawAmount, dispatch, updateBalances) => {
    if (!contract || !provider) {
      toast.error('Contract not initialized');
      return;
    }
    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error('Please enter a valid withdraw amount');
      return;
    }
  
    const withdrawAmountWei = ethers.parseEther(withdrawAmount);
  
    try {
      const network = await provider.getNetwork();
      if (network.chainId.toString(16) !== BSC_TESTNET_CHAIN_ID.slice(2)) {
        toast.error('Please switch to BSC Testnet');
        return;
      }
    } catch (error) {
      console.error('Error checking network:', error);
      toast.error('Failed to verify network: ' + (error.message || 'Unknown error'));
      return;
    }
  
    dispatch(setLoading(true));
    let txHash;
    try {
      const tx = await contract.withdraw(withdrawAmountWei, { gasLimit: 100000 });
      txHash = tx.hash;
      dispatch(
        addTransaction({
          hash: tx.hash,
          type: 'withdraw',
          from: account,
          value: withdrawAmount,
          timestamp: new Date().toISOString(),
          status: 'pending',
        })
      );
      await tx.wait();
      dispatch(
        updateTransaction({
          hash: tx.hash,
          status: 'success',
        })
      );
      await updateBalances();
      dispatch(
        addEvent({
          type: 'Withdrawal',
          user: account,
          amount: withdrawAmount,
          timestamp: new Date().toISOString(),
        })
      );
    
      toast.success('Withdrawal successful!');
      return true;
    } catch (error) {
      console.error('Withdraw error details:', error);
      if (error.code !== 'ACTION_REJECTED' && txHash) {
        dispatch(
          updateTransaction({
            hash: txHash,
            status: 'failed',
          })
        );
      }
      let errorMessage = 'Failed to withdraw: Transaction reverted';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else {
        try {
          const data = contract.interface.encodeFunctionData('withdraw', [withdrawAmountWei]);
          await provider.call({
            to: contractAddress,
            from: account,
            data: data,
          });
        } catch (callError) {
          console.error('Provider call error:', callError);
          if (callError.data) {
            try {
              const parsedError = contract.interface.parseError(callError.data);
              if (parsedError.name === 'InsufficientBalance') {
                const { requested, available } = parsedError.args;
                errorMessage = `Insufficient balance: Requested ${ethers.formatEther(requested)} ETH, available ${ethers.formatEther(available)} ETH`;
              } else {
                errorMessage = `Failed to withdraw: ${parsedError.name || 'Transaction reverted'}`;
              }
            } catch (parseError) {
              console.error('Error parsing provider call error:', parseError);
              errorMessage = 'Insufficient balance: Not enough funds';
            }
          } else {
            errorMessage = 'Insufficient balance: Not enough funds';
          }
        }
      }
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

export const resetCounter = async (contract, account, counter, dispatch) => {
    if (!contract) {
      toast.error('Contract not initialized');
      return;
    }
    if (counter === '0') {
      toast.error('Counter is already 0');
      return;
    }
    dispatch(setLoading(true));
    let txHash; 
    try {
      const tx = await contract.resetCounter({ gasLimit: 100000 });
      txHash = tx.hash; 
      dispatch(
        addTransaction({
          hash: tx.hash,
          type: 'resetCounter',
          from: account,
          timestamp: new Date().toISOString(),
          status: 'pending',
        })
      );
      await tx.wait();
      dispatch(
        updateTransaction({
          hash: tx.hash,
          status: 'success',
        })
      );
      dispatch(setCounter('0'));
      toast.success('Counter reset successfully!');
      return true;
    } catch (error) {
      console.error('Reset counter error details:', error);
      if (error.code !== 'ACTION_REJECTED' && txHash) {
        dispatch(
          updateTransaction({
            hash: txHash,
            status: 'failed',
          })
        );
      }
      let errorMessage = 'Failed to reset counter: Transaction reverted';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else {
        try {
          const data = contract.interface.encodeFunctionData('resetCounter', []);
          await provider.call({
            to: contractAddress,
            from: account,
            data: data,
          });
        } catch (callError) {
          console.error('Provider call error:', callError);
          if (callError.data) {
            try {
              const parsedError = contract.interface.parseError(callError.data);
              if (parsedError.name === 'NotContractOwner') {
                const { caller, owner } = parsedError.args;
                errorMessage = `Only contract owner can reset counter: Caller ${caller.slice(0, 6)}... is not owner ${owner.slice(0, 6)}...`;
              } else {
                errorMessage = `Failed to reset counter: ${parsedError.name || 'Transaction reverted'}`;
              }
            } catch (parseError) {
              console.error('Error parsing provider call error:', parseError);
              errorMessage = 'Only contract owner can reset counter';
            }
          } else {
            errorMessage = 'Only contract owner can reset counter';
          }
        }
      }
      toast.error(errorMessage);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };