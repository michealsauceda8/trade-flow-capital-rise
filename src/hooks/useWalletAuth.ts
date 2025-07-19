import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from './useWallet';
import { useToast } from '@/hooks/use-toast';

interface WalletUser {
  id: string;
  wallet_address: string;
  chain_id: number;
  verified_at: string;
  last_login: string;
}

export const useWalletAuth = () => {
  const [walletUser, setWalletUser] = useState<WalletUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { walletState, signVerificationMessage } = useWallet();
  const { toast } = useToast();

  // Set wallet context for RLS policies - simplified approach
  const setWalletContext = useCallback(async (address: string) => {
    // For now, we'll handle this in the RLS policies directly
    console.log('Setting wallet context for:', address);
  }, []);

  // Check if wallet user exists
  const checkWalletUser = useCallback(async (address: string) => {
    if (!address) return null;

    try {
      await setWalletContext(address);
      
      const { data, error } = await supabase
        .from('wallet_users')
        .select('*')
        .eq('wallet_address', address.toLowerCase())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking wallet user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error checking wallet user:', error);
      return null;
    }
  }, [setWalletContext]);

  // Sign in with wallet
  const signInWithWallet = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!walletState.address) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsLoading(true);

      // Check if user exists
      const existingUser = await checkWalletUser(walletState.address);

      if (existingUser) {
        // Update last login
        await supabase
          .from('wallet_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', existingUser.id);

        setWalletUser(existingUser);
        await setWalletContext(walletState.address);

        toast({
          title: "Welcome back!",
          description: "Successfully signed in with your wallet."
        });

        return { success: true };
      } else {
        // Sign verification message
        const signature = await signVerificationMessage();
        if (!signature) {
          return { success: false, error: 'Failed to sign verification message' };
        }

        // Create new wallet user
        const verificationMessage = `Please sign this message to verify your wallet ownership.\n\nWallet: ${walletState.address}\nTimestamp: ${Date.now()}`;

        const { data: newUser, error } = await supabase
          .from('wallet_users')
          .insert({
            wallet_address: walletState.address.toLowerCase(),
            chain_id: walletState.chainId || 56, // Default to BSC
            signature,
            message: verificationMessage
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating wallet user:', error);
          return { success: false, error: 'Failed to create wallet user account' };
        }

        setWalletUser(newUser);
        await setWalletContext(walletState.address);

        toast({
          title: "Welcome!",
          description: "Your wallet has been successfully verified and registered."
        });

        return { success: true };
      }
    } catch (error) {
      console.error('Wallet sign in error:', error);
      return { success: false, error: 'An unexpected error occurred during wallet authentication' };
    } finally {
      setIsLoading(false);
    }
  }, [walletState.address, walletState.chainId, signVerificationMessage, checkWalletUser, setWalletContext, toast]);

  // Sign out
  const signOut = useCallback(async () => {
    setWalletUser(null);
    
    toast({
      title: "Signed out",
      description: "You have been signed out successfully."
    });
  }, [toast]);

  // Check authentication status when wallet changes
  useEffect(() => {
    const checkAuth = async () => {
      if (walletState.address && walletState.isConnected) {
        const user = await checkWalletUser(walletState.address);
        if (user) {
          setWalletUser(user);
          await setWalletContext(walletState.address);
        }
      } else {
        setWalletUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [walletState.address, walletState.isConnected, checkWalletUser, setWalletContext]);

  return {
    walletUser,
    isLoading,
    signInWithWallet,
    signOut,
    isAuthenticated: !!walletUser && walletState.isConnected
  };
};