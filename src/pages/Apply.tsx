
import React, { useState } from 'react';
import { Wallet, Shield, DollarSign, Zap, ArrowRight, AlertTriangle, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/Navbar';

const Apply = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [targetAmount, setTargetAmount] = useState(2000);

  const steps = [
    { id: 1, title: "Connect Wallet", icon: Wallet, completed: false },
    { id: 2, title: "Verify Ownership", icon: Shield, completed: false },
    { id: 3, title: "Proof of Funds", icon: DollarSign, completed: false },
    { id: 4, title: "Submit Application", icon: Zap, completed: false }
  ];

  const handleConnectWallet = () => {
    // Simulate wallet connection
    setWalletConnected(true);
    setWalletAddress('0x742d35Cc6634C0532925a3b8D0Ac3e0cf9e0d5e');
    setCurrentStep(2);
  };

  const handleVerifyOwnership = () => {
    setCurrentStep(3);
  };

  const handleSubmitApplication = () => {
    setCurrentStep(4);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Apply for <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Funding</span>
            </h1>
            <p className="text-xl text-slate-300">
              Complete the steps below to get funded in 24-48 hours
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step, index) => (
                <div 
                  key={step.id}
                  className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
                >
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    currentStep >= step.id 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-transparent text-white' 
                      : 'border-slate-600 text-slate-400'
                  }`}>
                    <step.icon className="h-6 w-6" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-300 ${
                      currentStep > step.id ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-slate-700'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {steps.map((step) => (
                <div key={step.id} className="text-center">
                  <div className={`text-sm font-medium transition-colors ${
                    currentStep >= step.id ? 'text-white' : 'text-slate-500'
                  }`}>
                    {step.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-white">
                <steps[currentStep - 1].icon className="h-6 w-6 text-blue-400" />
                <span>Step {currentStep}: {steps[currentStep - 1].title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Step 1: Connect Wallet */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Connect Your Wallet</h3>
                    <p className="text-slate-300 mb-6">
                      Connect your crypto wallet to verify your identity. We support all major wallets.
                    </p>
                  </div>

                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">
                      <strong>Security Warning:</strong> Never share your recovery phrase or private key! 
                      We only verify ownership via signature.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={handleConnectWallet}
                      className="h-16 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white flex items-center justify-center space-x-3"
                    >
                      <img src="https://trustwallet.com/assets/images/trust_platform_assets/logo.png" alt="Trust Wallet" className="h-8 w-8" />
                      <span className="font-semibold">Trust Wallet</span>
                    </Button>
                    <Button 
                      onClick={handleConnectWallet}
                      className="h-16 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white flex items-center justify-center space-x-3"
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="h-8 w-8" />
                      <span className="font-semibold">MetaMask</span>
                    </Button>
                  </div>

                  <div className="text-center">
                    <p className="text-slate-400 text-sm">
                      Don't have a wallet? <a href="#" className="text-blue-400 hover:text-blue-300">Download Trust Wallet</a>
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Verify Ownership */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Verify Wallet Ownership</h3>
                    <p className="text-slate-300 mb-6">
                      Sign a message to prove you own this wallet. This is completely secure and doesn't give us access to your funds.
                    </p>
                  </div>

                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400">Connected Wallet:</span>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="font-mono text-sm text-white bg-slate-800 p-3 rounded">
                      {walletAddress}
                    </div>
                  </div>

                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-300">
                      Your wallet is connected securely. Click below to sign the verification message.
                    </AlertDescription>
                  </Alert>

                  <div className="text-center">
                    <Button 
                      onClick={handleVerifyOwnership}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3"
                    >
                      Sign Message to Verify
                      <Shield className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Proof of Funds */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Proof of Funds Deposit</h3>
                    <p className="text-slate-300 mb-6">
                      Deposit funds to your connected wallet and hold for 24 hours. Higher amounts = faster approval & larger funding.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-700/50 rounded-lg p-6">
                      <h4 className="text-white font-semibold mb-4">Current Balance</h4>
                      <div className="text-3xl font-bold text-blue-400 mb-2">
                        ${balance.toLocaleString()}
                      </div>
                      <div className="text-slate-400 text-sm">
                        Last updated: Just now
                      </div>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-6">
                      <h4 className="text-white font-semibold mb-4">Target Amount</h4>
                      <div className="text-3xl font-bold text-green-400 mb-2">
                        ${targetAmount.toLocaleString()}+
                      </div>
                      <div className="text-slate-400 text-sm">
                        Recommended minimum
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <DollarSign className="h-6 w-6 text-blue-400 mt-1" />
                      <div>
                        <h4 className="text-white font-semibold mb-2">Why We Need This</h4>
                        <p className="text-slate-300">
                          This proves you're a serious trader with real capital, not someone looking to gamble. 
                          Your funds remain 100% under your control at all times.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-white font-semibold">Funding Tiers</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                        <div className="text-blue-400 font-semibold mb-2">Starter</div>
                        <div className="text-white font-bold mb-1">$2K - $5K</div>
                        <div className="text-slate-400 text-sm">Get up to $25K funding</div>
                      </div>
                      <div className="bg-slate-700/30 rounded-lg p-4 border border-yellow-500">
                        <div className="text-yellow-400 font-semibold mb-2">Professional</div>
                        <div className="text-white font-bold mb-1">$5K - $10K</div>
                        <div className="text-slate-400 text-sm">Get up to $100K funding</div>
                      </div>
                      <div className="bg-slate-700/30 rounded-lg p-4 border border-purple-500">
                        <div className="text-purple-400 font-semibold mb-2">Elite</div>
                        <div className="text-white font-bold mb-1">$10K+</div>
                        <div className="text-slate-400 text-sm">Get up to $500K funding</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button 
                      onClick={handleSubmitApplication}
                      disabled={balance < targetAmount}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white px-8 py-3"
                    >
                      {balance >= targetAmount ? 'Continue to Submission' : 'Waiting for Deposit...'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Submit Application */}
              {currentStep === 4 && (
                <div className="space-y-6 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">Application Submitted!</h3>
                    <p className="text-slate-300 mb-6">
                      Your application has been submitted successfully. We'll review it and get back to you within 24-48 hours.
                    </p>
                  </div>

                  <div className="bg-slate-700/50 rounded-lg p-6">
                    <h4 className="text-white font-semibold mb-4">What happens next?</h4>
                    <div className="space-y-3 text-left">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-slate-300">We verify your wallet balance and trading history</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-slate-300">Risk assessment and compliance check</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-slate-300">Funding approval and capital deployment</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                      Track Application Status
                    </Button>
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                      Join Our Telegram
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Apply;
