import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, FileText, Shield, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';

const Terms = () => {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || 'dashboard';

  const handleAccept = () => {
    if (agreed) {
      localStorage.setItem('termsAgreed', 'true');
      navigate(`/${redirectPath}`);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

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
              onClick={handleBack}
              className="mr-4 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Terms & <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Conditions</span>
            </h1>
            <p className="text-xl text-slate-300">
              Please read and accept our terms to continue with your application
            </p>
          </div>

          {/* Terms Content */}
          <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-white">
                <FileText className="h-6 w-6 text-blue-400" />
                <span>Trading Fund Application Terms</span>
              </CardTitle>
              <CardDescription className="text-slate-300">
                By proceeding with your application, you agree to the following terms and conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* KYC Requirements */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-blue-400 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">KYC & Compliance Requirements</h3>
                    <ul className="text-slate-300 space-y-2 text-sm">
                      <li>• You must provide accurate and complete personal information</li>
                      <li>• Valid government-issued photo identification is required</li>
                      <li>• Proof of address documentation must be provided</li>
                      <li>• You consent to identity verification checks and background screening</li>
                      <li>• False information may result in immediate application rejection</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Trading Requirements */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Users className="h-6 w-6 text-green-400 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Trading Fund Requirements</h3>
                    <ul className="text-slate-300 space-y-2 text-sm">
                      <li>• Minimum age requirement: 18 years old</li>
                      <li>• You must demonstrate proof of funds via USD1 World Liberty token deposit</li>
                      <li>• Wallet verification and ownership signatures are mandatory</li>
                      <li>• You agree to follow all trading rules and risk management protocols</li>
                      <li>• Profit sharing percentages are determined by your funding tier</li>
                      <li>• All trading activities are monitored and subject to review</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Financial Disclaimers */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <h3 className="text-yellow-400 font-semibold mb-2">Important Financial Disclaimers</h3>
                <ul className="text-slate-300 space-y-1 text-sm">
                  <li>• Trading involves substantial risk and may result in losses</li>
                  <li>• Past performance does not guarantee future results</li>
                  <li>• You are responsible for understanding all risks involved</li>
                  <li>• Funding is provided for approved applicants only</li>
                  <li>• All trades are subject to our risk management system</li>
                </ul>
              </div>

              {/* Data Privacy */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h3 className="text-blue-400 font-semibold mb-2">Data Privacy & Security</h3>
                <ul className="text-slate-300 space-y-1 text-sm">
                  <li>• Your personal data is encrypted and stored securely</li>
                  <li>• We comply with all applicable data protection regulations</li>
                  <li>• Your information is used solely for application processing</li>
                  <li>• We may share data with regulatory authorities if required</li>
                  <li>• You have the right to request data deletion after application completion</li>
                </ul>
              </div>

              {/* Legal Agreement */}
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Legal Agreement</h3>
                <p className="text-slate-300 text-sm">
                  By checking the box below and proceeding, you acknowledge that you have read, understood, 
                  and agree to all terms and conditions. You confirm that all information provided will be 
                  accurate and complete, and you understand the risks associated with trading activities.
                </p>
              </div>

            </CardContent>
          </Card>

          {/* Agreement Checkbox */}
          <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3 mb-6">
                <Checkbox 
                  id="terms-agreement" 
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="terms-agreement" className="text-slate-300 text-sm leading-relaxed cursor-pointer">
                  I have read and agree to all the terms and conditions stated above. I understand the risks 
                  involved in trading and confirm that all information I provide will be accurate and complete.
                </label>
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAccept}
                  disabled={!agreed}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Accept Terms & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Terms;