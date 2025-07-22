import { mainnet, bscTestnet, arbitrum, sepolia } from '@reown/appkit/networks'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'

// Get projectId from https://cloud.reown.com
export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID
export const origin = import.meta.env.VITE_ORIGIN

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Create a metadata object - optional
export const metadata = {
  name: 'AppKit',
  description: 'AppKit Example',
  url: origin, // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// for custom networks visit -> https://docs.reown.com/appkit/react/core/custom-networks
export const networks = [mainnet, bscTestnet, arbitrum, sepolia] 

// Set up Solana Adapter
export const ethersAdapter = new EthersAdapter();