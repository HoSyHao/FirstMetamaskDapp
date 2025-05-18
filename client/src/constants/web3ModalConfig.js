// src/constants/web3ModalConfig.js
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';

const projectId = '783fa17a218d7c67191ec2dd83458cfd';

const bscTestnet = {
  chainId: 97,
  name: 'BSC Testnet',
  currency: 'tBNB',
  explorerUrl: 'https://testnet.bscscan.com',
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
};

const metadata = {
  name: 'MetaMask Dapp',
  description: 'A decentralized application with Web3Modal',
  url: 'http://localhost:5173',
  icons: ['https://your-dapp-url.com/icon.png']
};

const modal = createWeb3Modal({
  ethersConfig: defaultConfig({
    metadata,
    defaultChainId: 97,
    chains: [bscTestnet]
  }),
  chains: [bscTestnet],
  projectId,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#2563eb',
  }
});

export default modal;