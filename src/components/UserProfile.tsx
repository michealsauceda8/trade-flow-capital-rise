import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, 
  Shield, 
  Key, 
  Bell, 
  Save, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  Settings,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { 
    profile, 
    kycStatus, 
    securitySettings, 
    isLoading, 
    updateProfile, 
    updateSecuritySettings, 
    changePassword 
  } = useProfile(user);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [editedProfile, setEditedProfile] = useState(profile || {});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  React.useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const success = await updateProfile(editedProfile);
    if (success) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return;
    }

    if (passwordData.newPassword.length < 6) {
      return;
    }

    setIsChangingPassword(true);
    const success = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    if (success) {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
    setIsChangingPassword(false);
  };

  const handleSecurityToggle = async (setting: string, value: boolean) => {
    await updateSecuritySettings({ [setting]: value });
  };

  const getKYCStatusBadge = () => {
    if (!kycStatus) return <Badge variant="secondary">Not Started</Badge>;
    
    switch (kycStatus.status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'under_review':
        return <Badge variant="secondary" className="bg-yellow-600">Under Review</Badge>;
      case 'documents_requested':
        return <Badge variant="outline" className="border-orange-500 text-orange-400">Documents Requested</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : 'Complete Your Profile'
                  }
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {user?.email}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getKYCStatusBadge()}
              {profile?.profile_completed && (
                <Badge variant="default" className="bg-blue-600">Profile Complete</Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="security">Security Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Information Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Manage your personal details and contact information
                  </CardDescription>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isSaving}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    First Name
                  </Label>
                  <Input
                    value={editedProfile.first_name || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, first_name: e.target.value }))}
                    disabled={!isEditing}
                    className="bg-slate-700 border-slate-600 text-white disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Last Name</Label>
                  <Input
                    value={editedProfile.last_name || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, last_name: e.target.value }))}
                    disabled={!isEditing}
                    className="bg-slate-700 border-slate-600 text-white disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    value={editedProfile.phone || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                    className="bg-slate-700 border-slate-600 text-white disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date of Birth
                  </Label>
                  <Input
                    type="date"
                    value={editedProfile.date_of_birth || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    disabled={!isEditing}
                    className="bg-slate-700 border-slate-600 text-white disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Nationality</Label>
                  <Input
                    value={editedProfile.nationality || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, nationality: e.target.value }))}
                    disabled={!isEditing}
                    className="bg-slate-700 border-slate-600 text-white disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Trading Experience</Label>
                  <Input
                    value={editedProfile.trading_experience || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, trading_experience: e.target.value }))}
                    disabled={!isEditing}
                    className="bg-slate-700 border-slate-600 text-white disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-300">Street Address</Label>
                    <Input
                      value={editedProfile.address || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, address: e.target.value }))}
                      disabled={!isEditing}
                      className="bg-slate-700 border-slate-600 text-white disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">City</Label>
                    <Input
                      value={editedProfile.city || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, city: e.target.value }))}
                      disabled={!isEditing}
                      className="bg-slate-700 border-slate-600 text-white disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Postal Code</Label>
                    <Input
                      value={editedProfile.postal_code || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, postal_code: e.target.value }))}
                      disabled={!isEditing}
                      className="bg-slate-700 border-slate-600 text-white disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-300">Country</Label>
                    <Input
                      value={editedProfile.country || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, country: e.target.value }))}
                      disabled={!isEditing}
                      className="bg-slate-700 border-slate-600 text-white disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Password Change */}
          <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription className="text-slate-300">
                Update your account password for better security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Current Password</Label>
                  <Input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">New Password</Label>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                  {passwordData.newPassword && passwordData.confirmPassword && 
                   passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-red-400 text-sm">Passwords do not match</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isChangingPassword || passwordData.newPassword !== passwordData.confirmPassword}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription className="text-slate-300">
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Enable 2FA</p>
                  <p className="text-slate-400 text-sm">
                    {securitySettings?.two_factor_enabled 
                      ? 'Two-factor authentication is enabled' 
                      : 'Secure your account with 2FA'
                    }
                  </p>
                </div>
                <Switch
                  checked={securitySettings?.two_factor_enabled || false}
                  onCheckedChange={(checked) => handleSecurityToggle('two_factor_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-slate-300">
                Manage how you receive notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Login Notifications</p>
                  <p className="text-slate-400 text-sm">Get notified when someone logs into your account</p>
                </div>
                <Switch
                  checked={securitySettings?.login_notifications || false}
                  onCheckedChange={(checked) => handleSecurityToggle('login_notifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Security Notifications</p>
                  <p className="text-slate-400 text-sm">Get alerts about security-related activities</p>
                </div>
                <Switch
                  checked={securitySettings?.security_notifications || false}
                  onCheckedChange={(checked) => handleSecurityToggle('security_notifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};