import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
import { Search, Eye, Edit, FileText, DollarSign, Users, TrendingUp, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Application {
  id: string;
  application_number: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  funding_amount: number;
  funding_tier: string;
  wallet_address: string;
  created_at: string;
  submitted_at: string;
  user_balances: any[];
  wallet_signatures: any[];
}

const statusColors = {
  pending: 'default',
  under_review: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  documents_requested: 'outline'
};

const Admin = () => {
  const { user, isAuthenticated } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
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

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      if (!isAdmin) return;

      try {
        const { data, error } = await supabase
          .from('applications')
          .select(`
            *,
            user_balances(*),
            wallet_signatures(*),
            application_status_history(*)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setApplications(data || []);
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

    fetchApplications();
  }, [isAdmin]);

  // Update application status
  const updateApplicationStatus = async () => {
    if (!selectedApp || !newStatus) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewer_id: user?.id
        })
        .eq('id', selectedApp.id);

      if (error) throw error;

      // Add status history note if provided
      if (statusNotes) {
        await supabase
          .from('application_status_history')
          .insert({
            application_id: selectedApp.id,
            status: newStatus,
            previous_status: selectedApp.status,
            changed_by: user?.id,
            notes: statusNotes
          });
      }

      toast({
        title: "Status Updated",
        description: `Application status changed to ${newStatus}`
      });

      // Refresh applications
      const { data } = await supabase
        .from('applications')
        .select(`
          *,
          user_balances(*),
          wallet_signatures(*),
          application_status_history(*)
        `)
        .order('created_at', { ascending: false });

      setApplications(data || []);
      setSelectedApp(null);
      setNewStatus('');
      setStatusNotes('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    totalFunding: applications
      .filter(app => app.status === 'approved')
      .reduce((sum, app) => sum + Number(app.funding_amount), 0)
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage trading fund applications</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalFunding.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by application number, name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="documents_requested">Documents Requested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>
              {filteredApplications.length} of {applications.length} applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application #</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Funding Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.application_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{app.first_name} {app.last_name}</div>
                        <div className="text-sm text-muted-foreground">{app.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>${app.funding_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[app.status as keyof typeof statusColors] as any}>
                        {app.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(app.submitted_at || app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedApp(app)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                              <DialogDescription>
                                {selectedApp?.application_number}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedApp && (
                              <div className="space-y-6">
                                <Tabs defaultValue="details">
                                  <TabsList>
                                    <TabsTrigger value="details">Details</TabsTrigger>
                                    <TabsTrigger value="balances">Balances</TabsTrigger>
                                    <TabsTrigger value="signatures">Signatures</TabsTrigger>
                                    <TabsTrigger value="status">Update Status</TabsTrigger>
                                  </TabsList>
                                  
                                  <TabsContent value="details" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Name</Label>
                                        <p>{selectedApp.first_name} {selectedApp.last_name}</p>
                                      </div>
                                      <div>
                                        <Label>Email</Label>
                                        <p>{selectedApp.email}</p>
                                      </div>
                                      <div>
                                        <Label>Funding Amount</Label>
                                        <p>${selectedApp.funding_amount.toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <Label>Wallet Address</Label>
                                        <p className="font-mono text-sm">{selectedApp.wallet_address}</p>
                                      </div>
                                    </div>
                                  </TabsContent>
                                  
                                  <TabsContent value="balances">
                                    <div className="space-y-4">
                                      {selectedApp.user_balances.map((balance: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center p-3 border rounded">
                                          <div>
                                            <p className="font-medium">{balance.token_symbol} on {balance.chain_name}</p>
                                            <p className="text-sm text-muted-foreground">{balance.token_address}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-bold">${balance.balance}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </TabsContent>
                                  
                                  <TabsContent value="signatures">
                                    <div className="space-y-4">
                                      {selectedApp.wallet_signatures.map((sig: any, index: number) => (
                                        <div key={index} className="p-3 border rounded">
                                          <div className="flex justify-between items-start mb-2">
                                            <Badge>{sig.signature_type}</Badge>
                                            <span className="text-sm text-muted-foreground">
                                              Chain ID: {sig.chain_id}
                                            </span>
                                          </div>
                                          <p className="font-mono text-xs bg-muted p-2 rounded">
                                            {sig.signature.slice(0, 50)}...
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </TabsContent>
                                  
                                  <TabsContent value="status" className="space-y-4">
                                    <div>
                                      <Label htmlFor="newStatus">New Status</Label>
                                      <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select new status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="under_review">Under Review</SelectItem>
                                          <SelectItem value="approved">Approved</SelectItem>
                                          <SelectItem value="rejected">Rejected</SelectItem>
                                          <SelectItem value="documents_requested">Documents Requested</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor="notes">Notes (Optional)</Label>
                                      <Textarea
                                        id="notes"
                                        placeholder="Add notes about this status change..."
                                        value={statusNotes}
                                        onChange={(e) => setStatusNotes(e.target.value)}
                                      />
                                    </div>
                                    <Button 
                                      onClick={updateApplicationStatus}
                                      disabled={!newStatus || isUpdating}
                                      className="w-full"
                                    >
                                      {isUpdating ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Updating...
                                        </>
                                      ) : (
                                        'Update Status'
                                      )}
                                    </Button>
                                  </TabsContent>
                                </Tabs>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;