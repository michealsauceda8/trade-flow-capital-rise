import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Application {
  id: string;
  application_number: string;
  status: string;
  funding_amount: number;
  funding_tier: string;
  created_at: string;
  submitted_at: string;
  reviewed_at: string;
  application_status_history: any[];
}

const statusIcons = {
  pending: Clock,
  under_review: FileText,
  approved: CheckCircle,
  rejected: XCircle,
  documents_requested: FileText
};

const statusColors = {
  pending: 'default',
  under_review: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  documents_requested: 'outline'
};

const ApplicationTracking = () => {
  const { user, isAuthenticated } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    const fetchApplications = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('submit-application', {
          method: 'GET'
        });

        if (error) throw error;

        setApplications(data.applications || []);
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
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mr-4 text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Application Tracking</h1>
            <p className="text-slate-300">Track the status of your funding applications</p>
          </div>
        </div>

        {applications.length === 0 ? (
          <Card className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
            <CardContent className="p-8 text-center">
              <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Applications Found</h3>
              <p className="text-slate-300 mb-6">You haven't submitted any funding applications yet.</p>
              <Button 
                onClick={() => navigate('/apply')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Apply for Funding
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => {
              const StatusIcon = statusIcons[app.status as keyof typeof statusIcons] || FileText;
              
              return (
                <Card key={app.id} className="bg-slate-800/50 backdrop-blur-lg border-slate-700">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          <StatusIcon className="h-5 w-5" />
                          Application {app.application_number}
                        </CardTitle>
                        <CardDescription className="text-slate-300">
                          Submitted on {new Date(app.submitted_at || app.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant={statusColors[app.status as keyof typeof statusColors] as any}>
                        {app.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <p className="text-slate-400 text-sm">Funding Amount</p>
                        <p className="text-white font-semibold">${app.funding_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Funding Tier</p>
                        <p className="text-white font-semibold">{app.funding_tier}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Last Updated</p>
                        <p className="text-white font-semibold">
                          {new Date(app.reviewed_at || app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {app.application_status_history && app.application_status_history.length > 0 && (
                      <div>
                        <h4 className="text-white font-semibold mb-3">Status History</h4>
                        <div className="space-y-2">
                          {app.application_status_history
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((history: any, index: number) => (
                            <div key={index} className="flex justify-between items-center py-2 px-3 bg-slate-700/50 rounded">
                              <div>
                                <span className="text-white font-medium">
                                  {history.status.replace('_', ' ').toUpperCase()}
                                </span>
                                {history.notes && (
                                  <p className="text-slate-300 text-sm mt-1">{history.notes}</p>
                                )}
                              </div>
                              <span className="text-slate-400 text-sm">
                                {new Date(history.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationTracking;