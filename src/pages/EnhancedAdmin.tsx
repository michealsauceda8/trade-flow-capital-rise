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
import { Textarea } from '@/components/ui/textarea';
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
  Clock
} from 'lucide-react';
import Navbar from '@/components/Navbar';

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

interface Stats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalFundingRequested: number;
  totalEmailsSent: number;
}

const statusColors = {
  pending: 'secondary',
  under_review: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  documents_requested: 'outline'
};

const EnhancedAdmin = () => {
  const { user, isAuthenticated } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [emailNotifications, setEmailNotifications] = useState<EmailNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalFundingRequested: 0,
    totalEmailsSent: 0
  });
  const navigate = useNavigate();

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || !user) {
        navigate('/auth');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          setIsAdmin(false);
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges to access this page.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Admin check error:', error);
        navigate('/');
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, user, navigate]);

  // Fetch all data
  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Fetch applications
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          *,
          user_balances(*),
          wallet_signatures(*)
        `)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      // Fetch email notifications
      const { data: emailsData, error: emailsError } = await supabase
        .from('email_notifications')
        .select('*')
        .order('sent_at', { ascending: false });

      if (emailsError) throw emailsError;

      setApplications(appsData || []);
      setEmailNotifications(emailsData || []);

      // Calculate stats
      const apps = appsData || [];
      const newStats = {
        totalApplications: apps.length,
        pendingApplications: apps.filter(app => app.status === 'pending' || app.status === 'under_review').length,
        approvedApplications: apps.filter(app => app.status === 'approved').length,
        rejectedApplications: apps.filter(app => app.status === 'rejected').length,
        totalFundingRequested: apps.reduce((sum, app) => sum + app.funding_amount, 0),
        totalEmailsSent: emailsData?.length || 0
      };
      setStats(newStats);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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

      // Send email notification
      await supabase.functions.invoke('send-email-notification', {
        body: {
          applicationId: selectedApp.id,
          recipientEmail: selectedApp.email,
          notificationType: 'status_change',
          applicationNumber: selectedApp.application_number,
          status: newStatus
        }
      });

      toast({
        title: "Status Updated",
        description: `Application status changed to ${newStatus}. Email notification sent.`
      });

      // Refresh data
      fetchAllData();
      setSelectedApp(null);
      setNewStatus('');
      setStatusNotes('');

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

  const sendCustomEmail = async (appId: string, email: string, appNumber: string, type: string) => {
    try {
      await supabase.functions.invoke('send-email-notification', {
        body: {
          applicationId: appId,
          recipientEmail: email,
          notificationType: type,
          applicationNumber: appNumber
        }
      });

      toast({
        title: "Email Sent",
        description: `${type.replace('_', ' ')} email sent successfully`
      });

      fetchAllData(); // Refresh to show new email in logs
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
      ['Application Number', 'Name', 'Email', 'Status', 'Funding Amount', 'Created', 'Wallet Address'].join(','),
      ...filteredApplications.map(app => [
        app.application_number,
        `${app.first_name} ${app.last_name}`,
        app.email,
        app.status,
        app.funding_amount,
        new Date(app.created_at).toLocaleDateString(),
        app.wallet_address
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isAdmin) {
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
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
        </div>

        {/* Main Content */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="emails">Email Logs</TabsTrigger>
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
                {isLoading ? (
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
                            <TableCell className="text-white">
                              ${app.funding_amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {new Date(app.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
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
                                  <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle className="text-white">
                                        Application Details - {app.application_number}
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-slate-300">Applicant</Label>
                                          <p className="text-white">{app.first_name} {app.last_name}</p>
                                        </div>
                                        <div>
                                          <Label className="text-slate-300">Email</Label>
                                          <p className="text-white">{app.email}</p>
                                        </div>
                                        <div>
                                          <Label className="text-slate-300">Phone</Label>
                                          <p className="text-white">{app.phone}</p>
                                        </div>
                                        <div>
                                          <Label className="text-slate-300">Funding Tier</Label>
                                          <p className="text-white">{app.funding_tier}</p>
                                        </div>
                                        <div>
                                          <Label className="text-slate-300">Wallet Address</Label>
                                          <p className="text-white font-mono text-sm">{app.wallet_address}</p>
                                        </div>
                                        <div>
                                          <Label className="text-slate-300">Verified Balances</Label>
                                          <p className="text-white">{app.user_balances?.length || 0} tokens</p>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <Label className="text-slate-300">Update Status</Label>
                                        <Select value={newStatus} onValueChange={setNewStatus}>
                                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                            <SelectValue placeholder="Select new status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="under_review">Under Review</SelectItem>
                                            <SelectItem value="documents_requested">Documents Requested</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="flex space-x-2 pt-4">
                                        <Button
                                          onClick={updateApplicationStatus}
                                          disabled={!newStatus || isUpdating}
                                          className="bg-blue-600 hover:bg-blue-700"
                                        >
                                          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                          Update Status
                                        </Button>
                                        
                                        <Button
                                          variant="outline"
                                          onClick={() => sendCustomEmail(app.id, app.email, app.application_number, 'review_in_progress')}
                                          className="border-purple-600 text-purple-400"
                                        >
                                          <Mail className="h-4 w-4 mr-2" />
                                          Send Review Email
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
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

          {/* Email Logs Tab */}
          <TabsContent value="emails" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Email Notification Logs</CardTitle>
                <CardDescription className="text-slate-400">
                  Track all email notifications sent to applicants
                </CardDescription>
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
                      {emailNotifications.slice(0, 10).map((email) => (
                        <TableRow key={email.id} className="border-slate-700">
                          <TableCell className="text-white">{email.recipient_email}</TableCell>
                          <TableCell className="text-slate-300">
                            <Badge variant="outline">
                              {email.notification_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">{email.subject}</TableCell>
                          <TableCell>
                            <Badge variant={email.status === 'sent' ? 'default' : 'destructive'}>
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

          {/* Other tabs content would go here */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
                <CardDescription className="text-slate-400">
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">User management features will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">System Settings</CardTitle>
                <CardDescription className="text-slate-400">
                  Configure application settings and parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">System settings will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedAdmin;
