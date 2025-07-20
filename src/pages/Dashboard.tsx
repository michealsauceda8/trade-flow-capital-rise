
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Loader2,
  LogOut,
  Wallet,
  Shield,
  Key,
  User
} from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Application {
  id: string;
  application_number: string;
  status: string;
  funding_amount: number;
  funding_tier: string;
  created_at: string;
  submitted_at: string | null;
  user_balances: any[];
  wallet_signatures: any[];
}

const Dashboard = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    totalFundingRequested: 0
  });

  const { user, signOut, isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, kycStatus, canApplyForFunding } = useProfile(user);
  const navigate = useNavigate();

  // Handle redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (user && isAuthenticated) {
      fetchApplications();
    }
  }, [user, isAuthenticated]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('applications')
        .select(`
          *,
          user_balances(*)
        `);

      // Filter by authenticated user
      query = query.eq('user_id', user.id);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        toast({
          title: "Error",
          description: "Failed to fetch applications",
          variant: "destructive"
        });
        return;
      }

      const apps = data || [];
      setApplications(apps);

      // Calculate stats
      const stats = {
        totalApplications: apps.length,
        pendingApplications: apps.filter(app => app.status === 'pending' || app.status === 'under_review').length,
        approvedApplications: apps.filter(app => app.status === 'approved').length,
        totalFundingRequested: apps.reduce((sum, app) => sum + app.funding_amount, 0)
      };
      setStats(stats);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      </div>
    );
  }

  // Don't render if not authenticated - let the useEffect handle redirect
  if (!isAuthenticated || !user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: 'secondary',
    under_review: 'secondary',
    documents_requested: 'secondary', 
    approved: 'default',
    rejected: 'destructive'
  };

  const userDisplayName = user?.email || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <Navbar />
      
      <div className="pt-24 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Trading Dashboard</h1>
            <div className="text-sm text-slate-400">
              Welcome back, {profile?.first_name || user?.email?.split('@')[0] || 'User'}
            </div>
            <div className="text-sm text-muted-foreground">
              {user?.email}
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Button 
              variant="outline" 
              onClick={() => navigate('/profile')}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/apply')}
              className={`${
                canApplyForFunding() 
                  ? 'border-blue-600 text-blue-400 hover:bg-blue-600/10' 
                  : 'border-slate-600 text-slate-500 cursor-not-allowed'
              }`}
              disabled={!canApplyForFunding()}
            >
              <Plus className="w-4 h-4 mr-2" />
              {canApplyForFunding() ? 'New Application' : 'Complete KYC First'}
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleSignOut}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* KYC Status Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">KYC Status</p>
                  <p className={`text-lg font-bold ${
                    kycStatus?.status === 'approved' ? 'text-green-400' :
                    kycStatus?.status === 'under_review' ? 'text-yellow-400' :
                    kycStatus?.status === 'rejected' ? 'text-red-400' :
                    'text-slate-400'
                  }`}>
                    {kycStatus?.status === 'approved' ? 'Verified' :
                     kycStatus?.status === 'under_review' ? 'Under Review' :
                     kycStatus?.status === 'rejected' ? 'Rejected' :
                     'Pending'
                    }
                  </p>
                </div>
                <Shield className={`h-8 w-8 ${
                  kycStatus?.status === 'approved' ? 'text-green-400' :
                  kycStatus?.status === 'under_review' ? 'text-yellow-400' :
                  kycStatus?.status === 'rejected' ? 'text-red-400' :
                  'text-slate-400'
                }`} />
              </div>
              {!canApplyForFunding() && (
                <Button
                  size="sm"
                  onClick={() => navigate('/kyc')}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                >
                  Complete KYC
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Applications</p>
                  <p className="text-2xl font-bold text-white">{stats.totalApplications}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pending Review</p>
                  <p className="text-2xl font-bold text-white">{stats.pendingApplications}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Approved</p>
                  <p className="text-2xl font-bold text-white">{stats.approvedApplications}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Requested</p>
                  <p className="text-2xl font-bold text-white">${stats.totalFundingRequested.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            {/* KYC Warning */}
            {!canApplyForFunding() && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <div>
                    <h4 className="text-yellow-200 font-semibold">KYC Verification Required</h4>
                    <p className="text-yellow-100 text-sm">
                      Complete your KYC verification to apply for funding and access all platform features.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/kyc')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Start KYC
                  </Button>
                </div>
              </div>
            )}
            <CardTitle className="text-white">Your Applications</CardTitle>
            <CardDescription className="text-slate-400">
              Track the status of your funding applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Applications Yet</h3>
                <p className="text-slate-400 mb-6">
                  You haven't submitted any funding applications. Start by creating your first application.
                </p>
                <Button 
                  onClick={() => navigate('/apply')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  disabled={!canApplyForFunding()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {canApplyForFunding() ? 'Create Application' : 'Complete KYC First'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="border border-slate-600 rounded-lg p-6 bg-slate-700/30">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Application #{app.application_number}
                        </h3>
                        <p className="text-sm text-slate-400">
                          Applied on {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={statusColors[app.status as keyof typeof statusColors] as any}>
                        {app.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-slate-400">Requested Amount</p>
                        <p className="font-semibold text-white">${app.funding_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Funding Tier</p>
                        <p className="font-semibold text-white">{app.funding_tier}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Wallet Status</p>
                        <div className="flex items-center gap-2">
                          {app.wallet_signatures?.some((sig: any) => sig.signature_type === 'verification') ? (
                            <>
                              <Shield className="h-4 w-4 text-green-400" />
                              <span className="text-green-400 text-sm">Verified</span>
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-400 text-sm">Not Verified</span>
                            </>
                          )}
                        </div>
                       </div>
                       <div>
                         <p className="text-sm text-slate-400">WLFI Balance</p>
                         <p className="font-semibold text-white">
                           {app.user_balances?.find((b: any) => b.token_symbol === 'WLFI')?.balance 
                             ? `${parseFloat(app.user_balances.find((b: any) => b.token_symbol === 'WLFI').balance).toFixed(4)} WLFI`
                             : 'No balance'
                           }
                         </p>
                       </div>
                     </div>

                     {/* Wallet Information */}
                     {app.wallet_address && (
                       <div className="bg-slate-600/30 rounded-lg p-4 mb-4">
                         <div className="flex items-center gap-2 mb-2">
                           <Wallet className="h-4 w-4 text-blue-400" />
                           <span className="text-white font-medium">Connected Wallet</span>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                           <div>
                             <span className="text-slate-400">Address:</span>
                             <p className="text-white font-mono">{app.wallet_address.slice(0, 8)}...{app.wallet_address.slice(-6)}</p>
                           </div>
                           <div>
                             <span className="text-slate-400">Network:</span>
                             <p className="text-white">{app.chain_id === 56 ? 'BSC Mainnet' : `Chain ${app.chain_id}`}</p>
                           </div>
                           <div>
                             <span className="text-slate-400">Permits:</span>
                             <div className="flex items-center gap-1">
                               <span className="text-white">{app.wallet_signatures?.filter((sig: any) => sig.signature_type.includes('permit')).length || 0}</span>
                               {app.wallet_signatures?.some((sig: any) => sig.signature_type.includes('permit')) && (
                                 <Key className="h-3 w-3 text-yellow-400" />
                               )}
                             </div>
                           </div>
                         </div>
                      </div>
                     )}

                    {app.status === 'documents_requested' && (
                      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2" />
                          <p className="text-sm text-yellow-200">
                            Additional documents required. Please check your email for details.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
