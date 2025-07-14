import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
  Loader2
} from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Application {
  id: string;
  application_number: string;
  status: string;
  funding_amount: number;
  funding_tier: string;
  created_at: string;
  submitted_at: string;
  user_balances: any[];
}

const statusColors = {
  pending: 'default',
  under_review: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  documents_requested: 'outline'
};

const statusIcons = {
  pending: Clock,
  under_review: AlertTriangle,
  approved: CheckCircle,
  rejected: AlertTriangle,
  documents_requested: FileText
};

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    approvedFunding: 0,
    pendingReview: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    fetchApplications();
  }, [isAuthenticated, navigate]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          user_balances(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApplications(data || []);
      
      // Calculate stats
      const approved = data?.filter(app => app.status === 'approved') || [];
      const pending = data?.filter(app => app.status === 'pending' || app.status === 'under_review') || [];
      
      setStats({
        totalApplications: data?.length || 0,
        approvedFunding: approved.reduce((sum, app) => sum + Number(app.funding_amount), 0),
        pendingReview: pending.length
      });
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

  if (!isAuthenticated) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, {user?.email}
              </h1>
              <p className="text-slate-300">
                Manage your trading fund applications and track your progress
              </p>
            </div>
            <Button 
              onClick={() => navigate('/apply')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Total Applications</CardTitle>
                <FileText className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalApplications}</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Approved Funding</CardTitle>
                <DollarSign className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${stats.approvedFunding.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.pendingReview}</div>
              </CardContent>
            </Card>
          </div>

          {/* Applications */}
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
                  <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">No applications yet</h3>
                  <p className="text-slate-400 mb-4">
                    Ready to start trading with our capital? Submit your first application.
                  </p>
                  <Button 
                    onClick={() => navigate('/apply')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    Apply for Funding
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => {
                    const StatusIcon = statusIcons[app.status as keyof typeof statusIcons];
                    
                    return (
                      <div key={app.id} className="border border-slate-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <StatusIcon className="h-5 w-5 text-blue-400" />
                            <div>
                              <h3 className="font-semibold text-white">{app.application_number}</h3>
                              <p className="text-sm text-slate-400">
                                Applied on {new Date(app.created_at).toLocaleDateString()}
                              </p>
                            </div>
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
                            <p className="font-semibold text-white">{app.user_balances.length} tokens</p>
                          </div>
                        </div>

                        {app.status === 'documents_requested' && (
                          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-yellow-400 text-sm">
                              Additional documents required. Please check your email for details.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;