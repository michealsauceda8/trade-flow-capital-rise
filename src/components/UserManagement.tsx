import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Shield, 
  Search,
  Loader2,
  MoreHorizontal
} from 'lucide-react';

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  permissions: any;
  created_at: string;
  updated_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
}

export const UserManagement: React.FC = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('reviewer');
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch admin users
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (adminError) throw adminError;

      setAdminUsers(adminData || []);

      // In a real implementation, you would fetch regular users from auth.users
      // For now, we'll simulate this with applications data
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('user_id, email, created_at')
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      // Create unique users list
      const uniqueUsers = appsData?.reduce((acc: any[], app) => {
        if (!acc.find(u => u.id === app.user_id)) {
          acc.push({
            id: app.user_id,
            email: app.email,
            created_at: app.created_at,
            last_sign_in_at: app.created_at
          });
        }
        return acc;
      }, []) || [];

      setAuthUsers(uniqueUsers);

    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createAdminUser = async () => {
    if (!newUserEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      // In a real implementation, you would first invite the user via Supabase Auth
      // For now, we'll simulate creating an admin record
      
      // Find user by email from our applications
      const user = authUsers.find(u => u.email === newUserEmail);
      if (!user) {
        toast({
          title: "Error",
          description: "User not found. User must first create an account and apply for funding.",
          variant: "destructive"
        });
        return;
      }

      // Check if user is already an admin
      const existingAdmin = adminUsers.find(a => a.user_id === user.id);
      if (existingAdmin) {
        toast({
          title: "Error",
          description: "User is already an admin",
          variant: "destructive"
        });
        return;
      }

      const permissions = newUserRole === 'admin' 
        ? { admin: true, review: true, manage_users: true }
        : { admin: false, review: true, manage_users: false };

      const { error } = await supabase
        .from('admin_users')
        .insert({
          user_id: user.id,
          role: newUserRole,
          permissions
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Admin user created successfully with ${newUserRole} role`
      });

      setNewUserEmail('');
      setNewUserRole('reviewer');
      setIsDialogOpen(false);
      fetchUsers();

    } catch (error: any) {
      console.error('Error creating admin user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const removeAdminUser = async (adminUserId: string) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', adminUserId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin user removed successfully"
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error removing admin user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove admin user",
        variant: "destructive"
      });
    }
  };

  const filteredAuthUsers = authUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAdminUsers = adminUsers.filter(admin => {
    const user = authUsers.find(u => u.id === admin.user_id);
    return user?.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">User Management</h2>
          <p className="text-slate-400">Manage system users and admin privileges</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Admin User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create Admin User</DialogTitle>
              <DialogDescription className="text-slate-400">
                Grant admin privileges to an existing user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <Input
                  placeholder="Enter user email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Role</label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={createAdminUser}
                disabled={isCreating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Admin User'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input
          placeholder="Search users by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-700 border-slate-600 text-white"
        />
      </div>

      {/* Admin Users */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Users ({filteredAdminUsers.length})
          </CardTitle>
          <CardDescription className="text-slate-400">
            Users with administrative privileges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Email</TableHead>
                <TableHead className="text-slate-300">Role</TableHead>
                <TableHead className="text-slate-300">Permissions</TableHead>
                <TableHead className="text-slate-300">Created</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdminUsers.map((admin) => {
                const user = authUsers.find(u => u.id === admin.user_id);
                return (
                  <TableRow key={admin.id} className="border-slate-700">
                    <TableCell className="text-white">
                      {user?.email || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.role === 'admin' ? 'default' : 'secondary'}>
                        {admin.role.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {admin.permissions?.review && (
                          <Badge variant="outline" className="text-xs">Review</Badge>
                        )}
                        {admin.permissions?.admin && (
                          <Badge variant="outline" className="text-xs">Admin</Badge>
                        )}
                        {admin.permissions?.manage_users && (
                          <Badge variant="outline" className="text-xs">Manage Users</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeAdminUser(admin.id)}
                        className="text-red-400 border-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Regular Users */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({filteredAuthUsers.length})
          </CardTitle>
          <CardDescription className="text-slate-400">
            All registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Email</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Registered</TableHead>
                <TableHead className="text-slate-300">Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAuthUsers.map((user) => {
                const isAdmin = adminUsers.find(a => a.user_id === user.id);
                return (
                  <TableRow key={user.id} className="border-slate-700">
                    <TableCell className="text-white">{user.email}</TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Badge variant="default">Admin</Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {new Date(user.last_sign_in_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};