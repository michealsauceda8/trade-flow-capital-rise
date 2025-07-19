import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Mail, 
  DollarSign, 
  FileText, 
  Save,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string;
  updated_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  is_active: boolean;
}

export const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch system settings - using any to bypass types until regenerated
      const { data: settingsData, error: settingsError } = await (supabase as any)
        .from('system_settings')
        .select('*')
        .order('key');

      if (settingsError) throw settingsError;

      // Fetch email templates - using any to bypass types until regenerated
      const { data: templatesData, error: templatesError } = await (supabase as any)
        .from('email_templates')
        .select('*')
        .order('name');

      if (templatesError) throw templatesError;

      setSettings(settingsData || []);
      setEmailTemplates(templatesData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const { error } = await (supabase as any)
        .from('system_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) throw error;

      setSettings(prev => prev.map(setting => 
        setting.key === key 
          ? { ...setting, value, updated_at: new Date().toISOString() }
          : setting
      ));

      toast({
        title: "Success",
        description: "Setting updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive"
      });
    }
  };

  const updateEmailTemplate = async (template: EmailTemplate) => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('email_templates')
        .update({
          subject: template.subject,
          content: template.content,
          is_active: template.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id);

      if (error) throw error;

      setEmailTemplates(prev => prev.map(t => 
        t.id === template.id ? template : t
      ));

      setEditingTemplate(null);
      toast({
        title: "Success",
        description: "Email template updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getSetting = (key: string) => {
    return settings.find(s => s.key === key)?.value || {};
  };

  const getFundingTiers = () => {
    const fundingTiersValue = getSetting('funding_tiers');
    return Array.isArray(fundingTiersValue) ? fundingTiersValue : [];
  };

  const getApplicationSettings = () => {
    return getSetting('application_settings') || {};
  };

  const getEmailSettings = () => {
    return getSetting('email_settings') || {};
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">System Settings</h2>
          <p className="text-slate-400">Configure system-wide settings and preferences</p>
        </div>
        <Button 
          onClick={fetchData}
          variant="outline"
          className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="funding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="funding">Funding Settings</TabsTrigger>
          <TabsTrigger value="application">Application Settings</TabsTrigger>
          <TabsTrigger value="email">Email Templates</TabsTrigger>
        </TabsList>

        {/* Funding Settings */}
        <TabsContent value="funding" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Funding Tiers Configuration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure available funding tiers and their parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getFundingTiers().map((tier: any, index: number) => (
                <div key={index} className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Tier Name</label>
                      <Input
                        value={tier.name}
                        onChange={(e) => {
                          const newTiers = [...getFundingTiers()];
                          newTiers[index] = { ...tier, name: e.target.value };
                          updateSetting('funding_tiers', newTiers);
                        }}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Min Amount ($)</label>
                      <Input
                        type="number"
                        value={tier.min_amount}
                        onChange={(e) => {
                          const newTiers = [...getFundingTiers()];
                          newTiers[index] = { ...tier, min_amount: parseInt(e.target.value) };
                          updateSetting('funding_tiers', newTiers);
                        }}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Max Amount ($)</label>
                      <Input
                        type="number"
                        value={tier.max_amount}
                        onChange={(e) => {
                          const newTiers = [...getFundingTiers()];
                          newTiers[index] = { ...tier, max_amount: parseInt(e.target.value) };
                          updateSetting('funding_tiers', newTiers);
                        }}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Profit Share (%)</label>
                      <Input
                        type="number"
                        value={tier.profit_share}
                        onChange={(e) => {
                          const newTiers = [...getFundingTiers()];
                          newTiers[index] = { ...tier, profit_share: parseInt(e.target.value) };
                          updateSetting('funding_tiers', newTiers);
                        }}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Processing Days</label>
                      <Input
                        type="number"
                        value={tier.processing_days}
                        onChange={(e) => {
                          const newTiers = [...getFundingTiers()];
                          newTiers[index] = { ...tier, processing_days: parseInt(e.target.value) };
                          updateSetting('funding_tiers', newTiers);
                        }}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Application Settings */}
        <TabsContent value="application" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Application Configuration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure application processing settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Max File Size (MB)</label>
                  <Input
                    type="number"
                    value={getApplicationSettings().max_file_size_mb || 10}
                    onChange={(e) => {
                      const newSettings = { 
                        ...getApplicationSettings(), 
                        max_file_size_mb: parseInt(e.target.value) 
                      };
                      updateSetting('application_settings', newSettings);
                    }}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Auto Approve Threshold ($)</label>
                  <Input
                    type="number"
                    value={getApplicationSettings().auto_approve_threshold || 5000}
                    onChange={(e) => {
                      const newSettings = { 
                        ...getApplicationSettings(), 
                        auto_approve_threshold: parseInt(e.target.value) 
                      };
                      updateSetting('application_settings', newSettings);
                    }}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Require Wallet Signature</p>
                  <p className="text-slate-400 text-sm">Require users to sign with their wallet during application</p>
                </div>
                <Switch
                  checked={getApplicationSettings().require_wallet_signature || false}
                  onCheckedChange={(checked) => {
                    const newSettings = { 
                      ...getApplicationSettings(), 
                      require_wallet_signature: checked 
                    };
                    updateSetting('application_settings', newSettings);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="email" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage automated email templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailTemplates.map((template) => (
                <div key={template.id} className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-white font-medium">{template.name.replace('_', ' ').toUpperCase()}</h4>
                      <p className="text-slate-400 text-sm">Available variables: {template.variables.join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={(checked) => {
                          const updated = { ...template, is_active: checked };
                          updateEmailTemplate(updated);
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTemplate(template)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                  
                  {editingTemplate?.id === template.id && (
                    <div className="space-y-4 mt-4 p-4 border border-slate-600 rounded">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Subject</label>
                        <Input
                          value={editingTemplate.subject}
                          onChange={(e) => setEditingTemplate({
                            ...editingTemplate,
                            subject: e.target.value
                          })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Content</label>
                        <Textarea
                          value={editingTemplate.content}
                          onChange={(e) => setEditingTemplate({
                            ...editingTemplate,
                            content: e.target.value
                          })}
                          rows={8}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateEmailTemplate(editingTemplate)}
                          disabled={isSaving}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingTemplate(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};