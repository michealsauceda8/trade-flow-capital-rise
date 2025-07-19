import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { ArrowLeft, Wallet, Shield, CheckCircle } from 'lucide-react';

const WalletAuth = () => {
  const navigate = useNavigate();
  const { walletState, connectWallet } = useWallet();
  const { isAuthenticated, signInWithWallet, isLoading } = useWalletAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await signInWithWallet();
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Failed to sign in:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>

        {/* Auth Card */}
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
            <CardDescription>
              Sign in securely with your crypto wallet to access the trading platform
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Steps */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  walletState.isConnected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {walletState.isConnected ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-medium">1</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Connect Wallet</p>
                  <p className="text-xs text-muted-foreground">
                    {walletState.isConnected ? 'Connected' : 'Connect your MetaMask or WalletConnect'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isAuthenticated ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {isAuthenticated ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Verify Identity</p>
                  <p className="text-xs text-muted-foreground">
                    {isAuthenticated ? 'Verified' : 'Sign a message to verify wallet ownership'}
                  </p>
                </div>
              </div>
            </div>

            {/* Wallet Info */}
            {walletState.isConnected && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Connected Wallet</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {walletState.address}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Network: {walletState.chainId === 56 ? 'BSC' : `Chain ${walletState.chainId}`}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {!walletState.isConnected ? (
                <Button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="w-full"
                  size="lg"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              ) : !isAuthenticated ? (
                <Button
                  onClick={handleSignIn}
                  disabled={isSigningIn || isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isSigningIn ? 'Signing In...' : 'Sign Message & Continue'}
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="w-full"
                  size="lg"
                >
                  Go to Dashboard
                </Button>
              )}
            </div>

            {/* Security Note */}
            <div className="text-xs text-muted-foreground text-center space-y-2">
              <p>🔒 Your wallet signature proves ownership without revealing private keys</p>
              <p>We support MetaMask and WalletConnect compatible wallets</p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Link */}
        <div className="text-center">
          <Link 
            to="/auth" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Admin? Sign in with email
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WalletAuth;