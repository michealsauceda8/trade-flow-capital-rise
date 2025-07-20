import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile } from '@/components/UserProfile';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import Navbar from '@/components/Navbar';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth?returnTo=/profile');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="mr-4 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              User <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Profile</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Manage your personal information, security settings, and account preferences.
            </p>
          </div>

          {/* Profile Component */}
          <UserProfile />
        </div>
      </div>
    </div>
  );
};

export default Profile;