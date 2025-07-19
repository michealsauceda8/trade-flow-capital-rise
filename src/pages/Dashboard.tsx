import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Loader2,
  LogOut
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

  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in with email
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

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

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  if (!user) {
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
            <div className="text-sm text-muted-foreground">
              {userDisplayName}
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Button 
              variant="outline" 
              onClick={() => navigate('/apply')}
              className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Application
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
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Application
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Requested Amount</p>
                        <p className="font-semibold text-white">${app.funding_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Funding Tier</p>
                        <p className="font-semibold text-white">{app.funding_tier}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Verified Balances</p>
                        <p className="font-semibold text-white">{app.user_balances?.length || 0} tokens</p>
                      </div>
                    </div>

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