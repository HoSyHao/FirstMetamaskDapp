import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { setCounter, setContractBalance, setUserBalance } from '../redux/walletSlice';
import { contractABI, contractAddress, BSC_TESTNET_CHAIN_ID } from '../constants/contract';
import { INFURA_BSC_TESTNET_URL } from '../constants/infura';

const useContract = (account) => {
  const dispatch = useDispatch();
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [owner, setOwner] = useState(null);

  // Khởi tạo Infura provider để gọi các hàm "get"
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
      // Nếu chưa kết nối ví, đặt userBalance là 0
      dispatch(setUserBalance('0'));
    }
  };

  useEffect(() => {
    const initContract = async () => {
      try {
        // Kiểm tra kết nối Infura
        try {
          await infuraProvider.getNetwork();
          toast.success('Connected to Infura for contract data');
        } catch (error) {
          console.error('Failed to connect to Infura:', error);
          toast.error('Failed to connect to Infura: ' + (error.message || 'Unknown error'));
          return;
        }

        // Khởi tạo contract read-only với Infura
        const contractReadOnly = new ethers.Contract(contractAddress, contractABI, infuraProvider);

        // Gọi các hàm "get" bằng Infura ngay cả khi chưa kết nối ví
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

        // Nếu có account (kết nối ví), khởi tạo contract với signer
        if (account && window.ethereum) {
          const providerInstance = new ethers.BrowserProvider(window.ethereum);
          const network = await providerInstance.getNetwork();
          if (network.chainId.toString(16) !== BSC_TESTNET_CHAIN_ID.slice(2)) {
            toast.error('Please switch to BSC Testnet');
            return;
          }
          const signer = await providerInstance.getSigner();
          const contractWithSigner = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(contractWithSigner);
          setProvider(providerInstance);

          // Cập nhật userBalance khi có account
          const userBal = await contractWithSigner.getMyBalance();
          dispatch(setUserBalance(ethers.formatEther(userBal)));
        } else {
          setContract(contractReadOnly); // Sử dụng contract read-only nếu chưa kết nối
          dispatch(setUserBalance('0')); // Đặt userBalance là 0 khi chưa kết nối
        }
      } catch (error) {
        console.error('Error initializing contract:', error);
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