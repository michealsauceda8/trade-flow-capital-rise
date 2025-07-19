
import React, { useState, useEffect } from 'react';
import { Shield, FileText, DollarSign, CheckCircle, Upload, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Apply = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [kycCompleted, setKycCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetAmount, setTargetAmount] = useState(10000);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check authentication and terms agreement
  useEffect(() => {
    if (!user) {
      navigate('/auth?redirect=apply');
      return;
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
  }, [user, navigate, toast]);

  const [kycData, setKycData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
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
    { title: "Terms Acceptance", icon: Shield, completed: localStorage.getItem('termsAgreed') === 'true' },
    { title: "KYC Verification", icon: FileText, completed: kycCompleted },
    { title: "Funding Selection", icon: DollarSign, completed: false },
    { title: "Submit Application", icon: CheckCircle, completed: false }
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
    setCurrentStep(3);
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

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          first_name: kycData.firstName,
          last_name: kycData.lastName,
          email: kycData.email,
          phone: kycData.phone,
          date_of_birth: kycData.dateOfBirth,
          address: kycData.address,
          city: kycData.city,
          country: kycData.country,
          nationality: kycData.country,
          postal_code: '00000',
          trading_experience: 'intermediate',
          funding_amount: targetAmount,
          funding_tier: fundingTiers.find(tier => tier.amount === targetAmount)?.title || 'Custom',
          wallet_address: '',
          chain_id: 1,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Application Submitted!",
        description: `Your application ${data.application_number} has been submitted successfully.`
      });

      setCurrentStep(4);
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

              {/* Step 2: KYC Verification */}
              {currentStep === 2 && (
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
                        disabled
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

              {/* Step 3: Funding Selection */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center space-y-6">
                    <div className="bg-slate-700/50 rounded-2xl p-8">
                      <DollarSign className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">Select Funding Tier</h3>
                      <p className="text-slate-300 mb-6">
                        Choose your preferred funding amount based on your trading experience.
                      </p>
                      
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
                        onClick={() => setCurrentStep(4)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
                      >
                        Continue to Submit
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Submit Application */}
              {currentStep === 4 && (
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
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Name:</span>
                            <p className="text-white">{kycData.firstName} {kycData.lastName}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Email:</span>
                            <p className="text-white">{kycData.email}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Funding Amount:</span>
                            <p className="text-white">${targetAmount.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Tier:</span>
                            <p className="text-white">{fundingTiers.find(t => t.amount === targetAmount)?.title}</p>
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
