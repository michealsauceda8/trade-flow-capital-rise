import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface KYCDocument {
  id: string;
  document_type: 'government_id' | 'proof_of_address' | 'selfie' | 'additional';
  file_path: string;
  file_name: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
}

export interface KYCData {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  nationality: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  trading_experience: string;
}

export const useKYC = (user: User | null) => {
  const [kycVerification, setKycVerification] = useState<any>(null);
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchKYCData();
    }
  }, [user]);

  const fetchKYCData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch KYC verification
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (kycError && kycError.code !== 'PGRST116') {
        throw kycError;
      }

      // Fetch KYC documents if verification exists
      let documentsData: KYCDocument[] = [];
      if (kycData) {
        const { data: docsData, error: docsError } = await supabase
          .from('kyc_documents')
          .select('*')
          .eq('kyc_verification_id', kycData.id);

        if (docsError) {
          throw docsError;
        }

        documentsData = docsData || [];
      }

      setKycVerification(kycData);
      setDocuments(documentsData);

    } catch (error: any) {
      console.error('Error fetching KYC data:', error);
      toast({
        title: "Error",
        description: "Failed to load KYC data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitKYC = async (kycData: KYCData, uploadedFiles: Record<string, { path: string; name: string }>) => {
    if (!user) return false;

    try {
      setIsSubmitting(true);

      // Update user profile with KYC data
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          first_name: kycData.first_name,
          last_name: kycData.last_name,
          phone: kycData.phone,
          date_of_birth: kycData.date_of_birth,
          nationality: kycData.nationality,
          address: kycData.address,
          city: kycData.city,
          postal_code: kycData.postal_code,
          country: kycData.country,
          trading_experience: kycData.trading_experience,
          profile_completed: true
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update KYC verification status
      const { data: updatedKyc, error: kycError } = await supabase
        .from('kyc_verifications')
        .update({
          status: 'under_review',
          submitted_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (kycError) throw kycError;

      // Upload documents
      const documentPromises = Object.entries(uploadedFiles).map(async ([type, file]) => {
        if (file.path) {
          return supabase
            .from('kyc_documents')
            .insert({
              kyc_verification_id: updatedKyc.id,
              document_type: type as any,
              file_path: file.path,
              file_name: file.name,
              status: 'pending'
            });
        }
      });

      await Promise.all(documentPromises.filter(Boolean));

      // Log security event
      await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_event_type: 'kyc_submitted',
        p_description: 'KYC verification documents submitted for review'
      });

      toast({
        title: "KYC Submitted",
        description: "Your KYC verification has been submitted for review. You'll be notified once it's processed."
      });

      await fetchKYCData();
      return true;

    } catch (error: any) {
      console.error('Error submitting KYC:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit KYC verification",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadDocument = async (documentType: string, file: File) => {
    if (!user || !kycVerification) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/kyc/${documentType}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save document record
      const { data: docData, error: docError } = await supabase
        .from('kyc_documents')
        .insert({
          kyc_verification_id: kycVerification.id,
          document_type: documentType as any,
          file_path: fileName,
          file_name: file.name,
          status: 'pending'
        })
        .select()
        .single();

      if (docError) throw docError;

      await fetchKYCData();
      return { path: fileName, name: file.name };

    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
      return null;
    }
  };

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'under_review': return 'text-yellow-400';
      case 'documents_requested': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  const getKYCStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'under_review': return 'Under Review';
      case 'documents_requested': return 'Documents Requested';
      case 'pending': return 'Pending Submission';
      default: return 'Not Started';
    }
  };

  return {
    kycVerification,
    documents,
    isLoading,
    isSubmitting,
    submitKYC,
    uploadDocument,
    getKYCStatusColor,
    getKYCStatusText,
    refreshData: fetchKYCData
  };
};