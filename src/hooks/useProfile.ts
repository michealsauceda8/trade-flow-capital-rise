import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  trading_experience?: string;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface KYCVerification {
  id: string;
  user_id: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'documents_requested';
  verification_level: 'basic' | 'enhanced' | 'premium';
  submitted_at?: string;
  reviewed_at?: string;
  approved_at?: string;
  review_notes?: string;
  rejection_reason?: string;
}

export interface SecuritySettings {
  id: string;
  user_id: string;
  two_factor_enabled: boolean;
  login_notifications: boolean;
  security_notifications: boolean;
  last_password_change?: string;
  failed_login_attempts: number;
  account_locked_until?: string;
}

export const useProfile = (user: User | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [kycStatus, setKycStatus] = useState<KYCVerification | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setProfile(null);
      setKycStatus(null);
      setSecuritySettings(null);
      setIsLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Fetch KYC status
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (kycError && kycError.code !== 'PGRST116') {
        throw kycError;
      }

      // Fetch security settings
      const { data: securityData, error: securityError } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (securityError && securityError.code !== 'PGRST116') {
        throw securityError;
      }

      setProfile(profileData);
      setKycStatus(kycData);
      setSecuritySettings(securityData);

    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return false;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      // Log security event
      await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_event_type: 'profile_updated',
        p_description: 'User profile information updated'
      });

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });

      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateSecuritySettings = async (updates: Partial<SecuritySettings>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_security_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setSecuritySettings(prev => prev ? { ...prev, ...updates } : null);

      // Log security event
      await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_event_type: 'security_settings_updated',
        p_description: 'User security settings modified'
      });

      toast({
        title: "Success",
        description: "Security settings updated successfully"
      });

      return true;
    } catch (error: any) {
      console.error('Error updating security settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update security settings",
        variant: "destructive"
      });
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Update last password change
      await updateSecuritySettings({
        last_password_change: new Date().toISOString()
      });

      // Log security event
      await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_event_type: 'password_changed',
        p_description: 'User password changed successfully'
      });

      toast({
        title: "Success",
        description: "Password changed successfully"
      });

      return true;
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive"
      });
      return false;
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset email sent. Please check your inbox."
      });

      return true;
    } catch (error: any) {
      console.error('Error requesting password reset:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive"
      });
      return false;
    }
  };

  const isKYCRequired = () => {
    return !kycStatus || kycStatus.status !== 'approved';
  };

  const canApplyForFunding = () => {
    return kycStatus?.status === 'approved' && profile?.profile_completed;
  };

  return {
    profile,
    kycStatus,
    securitySettings,
    isLoading,
    updateProfile,
    updateSecuritySettings,
    changePassword,
    requestPasswordReset,
    isKYCRequired,
    canApplyForFunding,
    refreshData: fetchUserData
  };
};