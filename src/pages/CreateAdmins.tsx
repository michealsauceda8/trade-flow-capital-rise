import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const CreateAdmins = () => {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const createAdminAccounts = async () => {
    setIsCreating(true);
    try {
      // First create admin account
      const { data: adminData, error: adminSignUpError } = await supabase.auth.signUp({
        email: 'admin@tradingfund.com',
        password: 'Admin123!',
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            role: 'admin'
          }
        }
      });

      if (adminSignUpError) throw adminSignUpError;

      // Create reviewer account
      const { data: reviewerData, error: reviewerSignUpError } = await supabase.auth.signUp({
        email: 'reviewer@tradingfund.com', 
        password: 'Review123!',
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            role: 'reviewer'
          }
        }
      });

      if (reviewerSignUpError) throw reviewerSignUpError;

      // Sign out any current session
      await supabase.auth.signOut();

      toast({
        title: "Admin Accounts Created",
        description: "Admin and reviewer accounts have been created successfully. You can now sign in with them."
      });

      // Show credentials
      alert(`
Admin accounts created:

1. Email: admin@tradingfund.com
   Password: Admin123!
   Role: admin

2. Email: reviewer@tradingfund.com  
   Password: Review123!
   Role: reviewer

Auto-confirm is enabled, so you can sign in immediately.
      `);

    } catch (error: any) {
      console.error('Error creating admin accounts:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-center">Setup Admin Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-400 text-sm text-center">
            This will create dummy admin and reviewer accounts for testing the system.
          </p>
          
          <Button 
            onClick={createAdminAccounts}
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Accounts...
              </>
            ) : (
              'Create Admin Accounts'
            )}
          </Button>

          <div className="text-xs text-slate-500 space-y-1">
            <p><strong>Admin:</strong> admin@tradingfund.com / Admin123!</p>
            <p><strong>Reviewer:</strong> reviewer@tradingfund.com / Review123!</p>
          </div>

          <Button 
            variant="outline"
            onClick={() => navigate('/auth')}
            className="w-full border-slate-600 text-slate-300"
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAdmins;