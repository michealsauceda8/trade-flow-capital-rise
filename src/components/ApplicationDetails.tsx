import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Loader2
} from 'lucide-react';

interface Application {
  id: string;
  application_number: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address: string;
  city: string;
  country: string;
  nationality: string;
  postal_code: string;
  trading_experience: string;
  funding_amount: number;
  funding_tier: string;
  created_at: string;
  id_document_path?: string;
  proof_of_address_path?: string;
  selfie_path?: string;
  document_status?: string;
  review_notes?: string;
  reviewer_notes?: any;
}

interface ApplicationDetailsProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const statusColors = {
  pending: 'secondary' as const,
  under_review: 'secondary' as const,
  approved: 'default' as const,
  rejected: 'destructive' as const,
  documents_requested: 'outline' as const
};

export const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({
  application,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [newStatus, setNewStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [documentStatus, setDocumentStatus] = useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    if (application) {
      setNewStatus(application.status);
      setDocumentStatus(application.document_status || 'pending');
      setReviewNotes('');
    }
  }, [application]);

  const updateApplicationStatus = async () => {
    if (!application) return;

    setIsUpdating(true);
    try {
      const updateData: any = {
        status: newStatus,
        document_status: documentStatus
      };

      if (reviewNotes.trim()) {
        updateData.review_notes = reviewNotes;
      }

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', application.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Application status changed to ${newStatus}. Email notification will be sent automatically.`
      });

      onUpdate();
      onClose();
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

  const downloadDocument = async (path: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .download(path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const viewDocument = async (path: string) => {
    try {
      const { data } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(path);

      window.open(data.publicUrl, '_blank');
    } catch (error: any) {
      toast({
        title: "View Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (!application) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Application Details - {application.application_number}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Review and manage funding application
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700">
            <TabsTrigger value="details">Application Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="actions">Actions & Status</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="text-white">{application.first_name} {application.last_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-white">{application.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="text-white">{application.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date of Birth:</span>
                    <span className="text-white">{new Date(application.date_of_birth).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nationality:</span>
                    <span className="text-white">{application.nationality}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Address:</span>
                    <span className="text-white">{application.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">City:</span>
                    <span className="text-white">{application.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Country:</span>
                    <span className="text-white">{application.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Postal Code:</span>
                    <span className="text-white">{application.postal_code}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Funding Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Funding Amount:</span>
                    <span className="text-white">${application.funding_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Funding Tier:</span>
                    <span className="text-white">{application.funding_tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trading Experience:</span>
                    <span className="text-white">{application.trading_experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Status:</span>
                    <Badge variant={statusColors[application.status as keyof typeof statusColors]}>
                      {application.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created:</span>
                    <span className="text-white">{new Date(application.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Document Status:</span>
                    <Badge variant={application.document_status === 'approved' ? 'default' : 'secondary'}>
                      {(application.document_status || 'pending').toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {application.id_document_path && (
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Government ID</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewDocument(application.id_document_path!)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadDocument(application.id_document_path!, 'government-id.pdf')}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {application.proof_of_address_path && (
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Proof of Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewDocument(application.proof_of_address_path!)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadDocument(application.proof_of_address_path!, 'proof-of-address.pdf')}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {application.selfie_path && (
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Selfie</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewDocument(application.selfie_path!)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadDocument(application.selfie_path!, 'selfie.jpg')}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {application.review_notes && (
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Previous Review Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm">{application.review_notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Update Application Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Application Status</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Document Status</label>
                    <Select value={documentStatus} onValueChange={setDocumentStatus}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Review Notes</label>
                  <Textarea
                    placeholder="Add notes about this status change..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                  />
                </div>

                <Button
                  onClick={updateApplicationStatus}
                  disabled={isUpdating || newStatus === application.status}
                  className="w-full bg-blue-600 hover:bg-blue-700"
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};