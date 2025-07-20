import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useKYC } from '@/hooks/useKYC';
import { KYCForm } from '@/components/KYCForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';

const KYC = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { kycVerification, isLoading: kycLoading } = useKYC(user);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?returnTo=/kyc');
    }
  }, [user, authLoading, navigate]);

  // Redirect if KYC is already approved
  React.useEffect(() => {
    if (kycVerification?.status === 'approved') {
      navigate('/dashboard');
    }
  }, [kycVerification, navigate]);

  if (authLoading || kycLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="mr-4 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              KYC <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Verification</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Complete your identity verification to access all platform features. This is a one-time process required for regulatory compliance.
            </p>
          </div>

          {/* KYC Form */}
          <KYCForm />

          {/* Information Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Secure Process</h3>
                <p className="text-slate-300 text-sm">
                  Your documents are encrypted and stored securely. We comply with all data protection regulations.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Fast Review</h3>
                <p className="text-slate-300 text-sm">
                  Most verifications are completed within 24-48 hours. You'll be notified once approved.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">One-Time Only</h3>
                <p className="text-slate-300 text-sm">
                  Complete KYC once and access all platform features. No need to repeat the process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYC;