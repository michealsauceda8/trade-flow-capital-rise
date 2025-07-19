
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  FileText, 
  Mail,
  TrendingUp, 
  Settings,
  Edit2,
  Trash2,
  Eye,
  Filter,
  Download,
  Search,
  Bell,
  DollarSign,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  BarChart3,
  Shield
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { UserManagement } from '@/components/UserManagement';
import { SystemSettings } from '@/components/SystemSettings';
import { ApplicationDetails } from '@/components/ApplicationDetails';

interface Application {
  id: string;
  application_number: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  funding_amount: number;
  funding_tier: string;
  wallet_address: string;
  created_at: string;
  submitted_at: string;
  user_balances: any[];
  wallet_signatures: any[];
  id_document_path?: string;
  proof_of_address_path?: string;
  selfie_path?: string;
  document_status?: string;
  review_notes?: string;
}

interface EmailNotification {
  id: string;
  application_id: string;
  recipient_email: string;
  notification_type: string;
  subject: string;
  sent_at: string;
  status: string;
}

interface AdminActivity {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
}

interface Stats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalFundingRequested: number;
  totalEmailsSent: number;
  documentsUploaded: number;
  activeUsers: number;
}

const statusColors = {
  pending: 'secondary',
  under_review: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  documents_requested: 'outline'
};

const EnhancedAdmin = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [emailNotifications, setEmailNotifications] = useState<EmailNotification[]>([]);
  const [adminActivities, setAdminActivities] = useState<AdminActivity[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalFundingRequested: 0,
    totalEmailsSent: 0,
    documentsUploaded: 0,
    activeUsers: 0
  });
  const navigate = useNavigate();

  // Real-time subscriptions
  useEffect(() => {
    if (!isAdmin) return;

    const applicationsSubscription = supabase
      .channel('applications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, (payload) => {
        console.log('Applications change:', payload);
        fetchAllData();
      })
      .subscribe();

    const emailSubscription = supabase
      .channel('email-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_notifications' }, (payload) => {
        console.log('Email notifications change:', payload);
        fetchEmailNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(applicationsSubscription);
      supabase.removeChannel(emailSubscription);
    };
  }, [isAdmin]);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isLoading) return;

      if (!isAuthenticated || !user) {
        navigate('/auth?returnTo=/enhanced-admin', { replace: true });
        return;
      }

      try {
        setAdminCheckLoading(true);
        
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Admin check error:', error);
          toast({
            title: "Error",
            description: "Failed to check admin status",
            variant: "destructive"
          });
          navigate('/', { replace: true });
          return;
        }

        if (!data) {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive"
          });
          navigate('/', { replace: true });
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Admin check error:', error);
        navigate('/', { replace: true });
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();
  }, [isLoading, isAuthenticated, user, navigate]);

  // Fetch all data
  useEffect(() => {
    if (isAdmin && !adminCheckLoading) {
      fetchAllData();
    }
  }, [isAdmin, adminCheckLoading]);

  const fetchAllData = async () => {
    setIsDataLoading(true);
    try {
      await Promise.all([
        fetchApplications(),
        fetchEmailNotifications(),
        fetchAdminActivities()
      ]);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive"
      });
    } finally {
      setIsDataLoading(false);
    }
  };

  const fetchApplications = async () => {
    const { data: appsData, error: appsError } = await supabase
      .from('applications')
      .select(`
        *,
        user_balances(*),
        wallet_signatures(*)
      `)
      .order('created_at', { ascending: false });

    if (appsError) throw appsError;

    setApplications(appsData || []);
    
    // Calculate stats
    const apps = appsData || [];
    const documentsCount = apps.reduce((count, app) => {
      let docs = 0;
      if (app.id_document_path) docs++;
      if (app.proof_of_address_path) docs++;
      if (app.selfie_path) docs++;
      return count + docs;
    }, 0);

    setStats(prev => ({
      ...prev,
      totalApplications: apps.length,
      pendingApplications: apps.filter(app => app.status === 'pending' || app.status === 'under_review').length,
      approvedApplications: apps.filter(app => app.status === 'approved').length,
      rejectedApplications: apps.filter(app => app.status === 'rejected').length,
      totalFundingRequested: apps.reduce((sum, app) => sum + app.funding_amount, 0),
      documentsUploaded: documentsCount,
      activeUsers: new Set(apps.map(app => app.email)).size
    }));
  };

  const fetchEmailNotifications = async () => {
    const { data: emailsData, error: emailsError } = await supabase
      .from('email_notifications')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(100);

    if (emailsError) throw emailsError;

    setEmailNotifications(emailsData || []);
    setStats(prev => ({
      ...prev,
      totalEmailsSent: emailsData?.length || 0
    }));
  };

  const fetchAdminActivities = async () => {
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('admin_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (activitiesError) throw activitiesError;

    setAdminActivities(activitiesData || []);
  };

  const updateApplicationStatus = async () => {
    if (!selectedApp || !newStatus) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', selectedApp.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Application status changed to ${newStatus}. Email notification will be sent automatically.`
      });

      // Process pending emails
      await processEmailQueue();
      
      fetchAllData();
      setSelectedApp(null);
      setNewStatus('');

    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const processEmailQueue = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: { action: 'process_queue' }
      });

      if (error) {
        console.error('Email processing error:', error);
      }
    } catch (error) {
      console.error('Email queue processing failed:', error);
    }
  };

  const sendCustomEmail = async (appId: string, email: string, appNumber: string, type: string) => {
    try {
      const { error } = await supabase
        .from('email_notifications')
        .insert({
          application_id: appId,
          recipient_email: email,
          notification_type: type,
          subject: `${type.replace('_', ' ')} - ${appNumber}`,
          content: `Custom notification for application ${appNumber}`,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Email Queued",
        description: `${type.replace('_', ' ')} email has been queued for sending`
      });

      // Process the email queue
      await processEmailQueue();
      fetchAllData();
    } catch (error: any) {
      toast({
        title: "Email Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const exportData = () => {
    const csvContent = [
      ['Application Number', 'Name', 'Email', 'Status', 'Funding Amount', 'Created', 'Wallet Address', 'Documents'].join(','),
      ...filteredApplications.map(app => [
        app.application_number,
        `${app.first_name} ${app.last_name}`,
        app.email,
        app.status,
        app.funding_amount,
        new Date(app.created_at).toLocaleDateString(),
        app.wallet_address,
        `${app.id_document_path ? 'ID,' : ''}${app.proof_of_address_path ? 'Address,' : ''}${app.selfie_path ? 'Selfie' : ''}`.replace(/,$/, '')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Loading states
  if (isLoading || adminCheckLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-slate-400">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <Navbar />
      
      <div className="pt-24 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-slate-400">Complete CMS for Trading Fund Management</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Button 
              onClick={fetchAllData}
              variant="outline" 
              className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={exportData}
              variant="outline"
              className="border-green-600 text-green-400 hover:bg-green-600/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6 mb-8">
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
                  <p className="text-sm text-slate-400">Pending</p>
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
                  <p className="text-sm text-slate-400">Rejected</p>
                  <p className="text-2xl font-bold text-white">{stats.rejectedApplications}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Funding</p>
                  <p className="text-2xl font-bold text-white">${stats.totalFundingRequested.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Emails Sent</p>
                  <p className="text-2xl font-bold text-white">{stats.totalEmailsSent}</p>
                </div>
                <Mail className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Documents</p>
                  <p className="text-2xl font-bold text-white">{stats.documentsUploaded}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Active Users</p>
                  <p className="text-2xl font-bold text-white">{stats.activeUsers}</p>
                </div>
                <Users className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-slate-800/50">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="emails">Email Logs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-white">Application Management</CardTitle>
                    <CardDescription className="text-slate-400">
                      Review and manage all funding applications
                    </CardDescription>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="documents_requested">Documents Requested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isDataLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-300">Application #</TableHead>
                          <TableHead className="text-slate-300">Applicant</TableHead>
                          <TableHead className="text-slate-300">Email</TableHead>
                          <TableHead className="text-slate-300">Status</TableHead>
                          <TableHead className="text-slate-300">Documents</TableHead>
                          <TableHead className="text-slate-300">Funding</TableHead>
                          <TableHead className="text-slate-300">Applied</TableHead>
                          <TableHead className="text-slate-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApplications.map((app) => (
                          <TableRow key={app.id} className="border-slate-700">
                            <TableCell className="text-white font-mono">
                              {app.application_number}
                            </TableCell>
                            <TableCell className="text-white">
                              {app.first_name} {app.last_name}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {app.email}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusColors[app.status as keyof typeof statusColors] as any}>
                                {app.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {app.id_document_path && <Badge variant="outline" className="text-xs">ID</Badge>}
                                {app.proof_of_address_path && <Badge variant="outline" className="text-xs">Address</Badge>}
                                {app.selfie_path && <Badge variant="outline" className="text-xs">Selfie</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-white">
                              ${app.funding_amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {new Date(app.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedApp(app)}
                                    className="text-blue-400 hover:text-blue-300"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle className="text-white">
                                      Application Details - {app.application_number}
                                    </DialogTitle>
                                  </DialogHeader>
                                  {selectedApp && (
                                    <ApplicationDetails
                                      application={selectedApp}
                                      onStatusUpdate={(appId, status) => {
                                        setNewStatus(status);
                                        updateApplicationStatus();
                                      }}
                                      onSendEmail={(appId, email, appNumber, type) => 
                                        sendCustomEmail(appId, email, appNumber, type)
                                      }
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab - Now using UserManagement component */}
          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          {/* Email Logs Tab */}
          <TabsContent value="emails" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Email Notification Logs</CardTitle>
                    <CardDescription className="text-slate-400">
                      Track all email notifications sent to applicants
                    </CardDescription>
                  </div>
                  <Button
                    onClick={processEmailQueue}
                    variant="outline"
                    className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Process Queue
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Recipient</TableHead>
                        <TableHead className="text-slate-300">Type</TableHead>
                        <TableHead className="text-slate-300">Subject</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Sent At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailNotifications.slice(0, 20).map((email) => (
                        <TableRow key={email.id} className="border-slate-700">
                          <TableCell className="text-white">{email.recipient_email}</TableCell>
                          <TableCell className="text-slate-300">
                            <Badge variant="outline">
                              {email.notification_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">{email.subject}</TableCell>
                          <TableCell>
                            <Badge variant={email.status === 'sent' ? 'default' : email.status === 'pending' ? 'secondary' : 'destructive'}>
                              {email.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {new Date(email.sent_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Application Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Pending</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full" 
                            style={{ width: `${stats.totalApplications > 0 ? (stats.pendingApplications / stats.totalApplications) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-white text-sm">{stats.pendingApplications}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Approved</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-green-400 h-2 rounded-full" 
                            style={{ width: `${stats.totalApplications > 0 ? (stats.approvedApplications / stats.totalApplications) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-white text-sm">{stats.approvedApplications}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Rejected</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-red-400 h-2 rounded-full" 
                            style={{ width: `${stats.totalApplications > 0 ? (stats.rejectedApplications / stats.totalApplications) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-white text-sm">{stats.rejectedApplications}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Key Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Approval Rate</span>
                      <span className="text-white font-semibold">
                        {stats.totalApplications > 0 
                          ? ((stats.approvedApplications / (stats.approvedApplications + stats.rejectedApplications)) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Avg. Funding Amount</span>
                      <span className="text-white font-semibold">
                        ${stats.totalApplications > 0 
                          ? (stats.totalFundingRequested / stats.totalApplications).toLocaleString(undefined, { maximumFractionDigits: 0 })
                          : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Document Upload Rate</span>
                      <span className="text-white font-semibold">
                        {stats.totalApplications > 0 
                          ? ((stats.documentsUploaded / (stats.totalApplications * 3)) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Email Success Rate</span>
                      <span className="text-white font-semibold">
                        {emailNotifications.length > 0 
                          ? ((emailNotifications.filter(e => e.status === 'sent').length / emailNotifications.length) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Admin Activity Log
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Track all administrative actions and changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 bg-slate-700/50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium">
                            {activity.action.replace('_', ' ').toUpperCase()} - {activity.target_type}
                          </p>
                          <span className="text-slate-400 text-sm">
                            {new Date(activity.created_at).toLocaleString()}
                          </span>
                        </div>
                        {activity.details && (
                          <p className="text-slate-300 text-sm mt-1">
                            {activity.details.application_number && `Application: ${activity.details.application_number}`}
                            {activity.details.old_status && activity.details.new_status && 
                              ` | Status: ${activity.details.old_status} → ${activity.details.new_status}`
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab - Now using SystemSettings component */}
          <TabsContent value="settings" className="space-y-6">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedAdmin;
