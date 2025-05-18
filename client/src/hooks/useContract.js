import { useEffect, useState } from 'react';
import { BrowserProvider, ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { useAppKitProvider, useAppKitNetworkCore } from '@reown/appkit/react';
import { setCounter, setContractBalance, setUserBalance } from '../redux/slices/contractSlice';
import { contractABI, contractAddress, BSC_TESTNET_CHAIN_ID } from '../constants/contract';
import { INFURA_BSC_TESTNET_URL } from '../constants/infura';

const useContract = (account) => {
  const dispatch = useDispatch();
  const [contract, setContract] = useState(null);
  const [owner, setOwner] = useState(null);
  const { walletProvider } = useAppKitProvider('eip155');
  const { chainId } = useAppKitNetworkCore();

  const infuraProvider = new ethers.JsonRpcProvider(INFURA_BSC_TESTNET_URL);

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
    } else if (!account) {
      dispatch(setUserBalance('0'));
    }
  };

  useEffect(() => {
    const initContract = async () => {
      try {
        try {
          await infuraProvider.getNetwork();
          toast.success('Connected to Infura for contract data');
        } catch (error) {
          console.error('Failed to connect to Infura:', error);
          toast.error('Failed to connect to Infura: ' + (error.message || 'Unknown error'));
          return;
        }

        const contractReadOnly = new ethers.Contract(contractAddress, contractABI, infuraProvider);

        try {
          const counterValue = await contractReadOnly.counter();
          dispatch(setCounter(counterValue.toString()));
        } catch (err) {
          console.error('Error fetching counter:', err);
          toast.error('Failed to fetch counter');
        }

        try {
          const contractBal = await contractReadOnly.getContractBalance();
          dispatch(setContractBalance(ethers.formatEther(contractBal)));
        } catch (err) {
          console.error('Error fetching contract balance:', err);
          toast.error('Failed to fetch contract balance');
        }

        try {
          const ownerAddr = await contractReadOnly.owner();
          setOwner(ownerAddr);
        } catch (err) {
          console.error('Error fetching owner:', err);
          toast.error('Failed to fetch contract owner');
        }

        if (account && walletProvider) {
          const provider = new BrowserProvider(walletProvider, chainId);
          if (chainId.toString(16) !== BSC_TESTNET_CHAIN_ID.slice(2)) {
            toast.error('Please switch to BSC Testnet');
            return;
          }
          const signer = await provider.getSigner();
          const contractWithSigner = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(contractWithSigner);

          const userBal = await contractWithSigner.getMyBalance();
          dispatch(setUserBalance(ethers.formatEther(userBal)));
        } else {
          setContract(contractReadOnly); 
          dispatch(setUserBalance('0')); 
        }
      } catch (error) {
        console.error('Error initializing contract:', error);
        setContract(null);
      }
    };
    initContract();
  }, [account, dispatch, walletProvider, chainId]);

  return {
    contract,
    provider: walletProvider ? new BrowserProvider(walletProvider, chainId) : null,
    owner,
    updateBalances,
  };
};

export default useContract;