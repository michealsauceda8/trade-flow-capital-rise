import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/FileUpload';
import { useKYC, KYCData } from '@/hooks/useKYC';
import { useAuth } from '@/hooks/useAuth';
import { Shield, FileText, Upload, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export const KYCForm: React.FC = () => {
  const { user } = useAuth();
  const { kycVerification, isSubmitting, submitKYC } = useKYC(user);
  
  const [kycData, setKycData] = useState<KYCData>({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    nationality: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    trading_experience: 'intermediate'
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    government_id: { path: '', name: '' },
    proof_of_address: { path: '', name: '' },
    selfie: { path: '', name: '' }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'phone', 'date_of_birth', 'address', 'city', 'country'];
    const missingFields = requiredFields.filter(field => !kycData[field as keyof KYCData]);
    
    if (missingFields.length > 0) {
      return;
    }

    if (!uploadedFiles.government_id.path || !uploadedFiles.proof_of_address.path) {
      return;
    }

    await submitKYC(kycData, uploadedFiles);
  };

  const handleInputChange = (field: keyof KYCData, value: string) => {
    setKycData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUploaded = (type: string, path: string, name: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: { path, name }
    }));
  };

  // If KYC is already submitted, show status
  if (kycVerification && kycVerification.status !== 'pending') {
    return (
      <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-blue-400" />
            KYC Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            {kycVerification.status === 'under_review' && (
              <>
                <Clock className="h-16 w-16 text-yellow-400 mx-auto" />
                <h3 className="text-xl font-semibold text-white">Under Review</h3>
                <p className="text-slate-300">
                  Your KYC verification is being reviewed by our team. This typically takes 1-3 business days.
                </p>
              </>
            )}
            
            {kycVerification.status === 'approved' && (
              <>
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
                <h3 className="text-xl font-semibold text-white">Verification Approved</h3>
                <p className="text-slate-300">
                  Your identity has been successfully verified. You can now apply for funding.
                </p>
              </>
            )}
            
            {kycVerification.status === 'rejected' && (
              <>
                <AlertTriangle className="h-16 w-16 text-red-400 mx-auto" />
                <h3 className="text-xl font-semibold text-white">Verification Rejected</h3>
                <p className="text-slate-300">
                  {kycVerification.rejection_reason || 'Your KYC verification was rejected. Please contact support for more information.'}
                </p>
              </>
            )}
            
            {kycVerification.status === 'documents_requested' && (
              <>
                <FileText className="h-16 w-16 text-orange-400 mx-auto" />
                <h3 className="text-xl font-semibold text-white">Additional Documents Required</h3>
                <p className="text-slate-300">
                  {kycVerification.review_notes || 'Additional documents are required to complete your verification.'}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="h-5 w-5 text-blue-400" />
          Complete KYC Verification
        </CardTitle>
        <CardDescription className="text-slate-300">
          Verify your identity to access all platform features. This is a one-time process required for regulatory compliance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-slate-300">First Name *</Label>
                <Input
                  id="first_name"
                  value={kycData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-slate-300">Last Name *</Label>
                <Input
                  id="last_name"
                  value={kycData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={kycData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth" className="text-slate-300">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={kycData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality" className="text-slate-300">Nationality *</Label>
                <Input
                  id="nationality"
                  value={kycData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trading_experience" className="text-slate-300">Trading Experience</Label>
                <Select value={kycData.trading_experience} onValueChange={(value) => handleInputChange('trading_experience', value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (3-5 years)</SelectItem>
                    <SelectItem value="professional">Professional (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="text-slate-300">Street Address *</Label>
                <Input
                  id="address"
                  value={kycData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-slate-300">City *</Label>
                <Input
                  id="city"
                  value={kycData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code" className="text-slate-300">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={kycData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="country" className="text-slate-300">Country *</Label>
                <Input
                  id="country"
                  value={kycData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Document Upload</h3>
            
            <FileUpload
              folder="kyc/government-id"
              label="Government ID *"
              description="Upload your passport, driver's license, or national ID"
              onFileUploaded={(path, url) => handleFileUploaded('government_id', path, url)}
              required
            />

            <FileUpload
              folder="kyc/proof-of-address"
              label="Proof of Address *"
              description="Upload a utility bill, bank statement, or rental agreement (max 3 months old)"
              onFileUploaded={(path, url) => handleFileUploaded('proof_of_address', path, url)}
              required
            />

            <FileUpload
              folder="kyc/selfie"
              label="Selfie (Optional)"
              description="Upload a clear selfie for identity verification"
              accept={['image/*']}
              onFileUploaded={(path, url) => handleFileUploaded('selfie', path, url)}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting KYC...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit KYC Verification
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};