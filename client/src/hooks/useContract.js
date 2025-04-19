import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { setCounter, setContractBalance, setUserBalance } from '../redux/walletSlice';
import { contractABI, contractAddress, BSC_TESTNET_CHAIN_ID } from '../constants/contract';

const useContract = (account) => {
  const dispatch = useDispatch();
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [owner, setOwner] = useState(null);

  const updateBalances = async () => {
    if (contract && account) {
      try {
        const contractBal = await contract.getContractBalance();
        const userBal = await contract.getMyBalance();
        dispatch(setContractBalance(ethers.formatEther(contractBal)));
        dispatch(setUserBalance(ethers.formatEther(userBal)));
      } catch (error) {
        console.error('Error updating balances:', error);
        toast.error('Failed to update balances: ' + (error.message || 'Unknown error'));
      }
    }
  };

  useEffect(() => {
    const initContract = async () => {
      try {
        const providerInstance = new ethers.BrowserProvider(window.ethereum);
        setProvider(providerInstance);
        const network = await providerInstance.getNetwork();
        if (network.chainId.toString(16) !== BSC_TESTNET_CHAIN_ID.slice(2)) {
          toast.error('Please switch to BSC Testnet');
          return;
        }

        const signer = await providerInstance.getSigner();
        const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(contractInstance);

        try {
          const counterValue = await contractInstance.counter();
          dispatch(setCounter(counterValue.toString()));
        } catch (err) {
          console.error('Error fetching counter:', err);
          toast.error('Failed to fetch counter');
        }

        try {
          const contractBal = await contractInstance.getContractBalance();
          dispatch(setContractBalance(ethers.formatEther(contractBal)));
        } catch (err) {
          console.error('Error fetching contract balance:', err);
          toast.error('Failed to fetch contract balance');
        }

        try {
          const userBal = await contractInstance.getMyBalance();
          dispatch(setUserBalance(ethers.formatEther(userBal)));
        } catch (err) {
          console.error('Error fetching user balance:', err);
          toast.error('Failed to fetch user balance');
        }

        try {
          const ownerAddr = await contractInstance.owner();
          setOwner(ownerAddr);
          console.log('Contract owner:', ownerAddr, 'Current account:', account);
          if (account && ownerAddr && account.toLowerCase() !== ownerAddr.toLowerCase()) {
            toast.info('You are not the contract owner. Reset Counter button is hidden.');
          }
        } catch (err) {
          console.error('Error fetching owner:', err);
          toast.error('Failed to fetch contract owner');
        }
      } catch (error) {
        console.error('Error initializing contract:', error);
        toast.error('Failed to initialize contract: ' + (error.reason || error.message));
        setContract(null);
      }
    };
    initContract();
  }, [account, dispatch]);

  return {
    contract,
    provider,
    owner,
    updateBalances,
  };
};

export default useContract;