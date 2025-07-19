import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, 
  Save,
  Loader2,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

interface SiteConfig {
  site_name: string;
  tagline: string;
  contact_email: string;
  support_phone?: string;
  address?: string;
  footer_text?: string;
  maintenance_mode?: boolean;
}

interface TelegramSettings {
  bot_token: string;
  admin_chat_id: string;
  notifications_enabled: boolean;
}

export const CMSSettings: React.FC = () => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    site_name: '',
    tagline: '',
    contact_email: '',
  });
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>({
    bot_token: '',
    admin_chat_id: '',
    notifications_enabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data: settingsData, error } = await (supabase as any)
        .from('system_settings')
        .select('*')
        .in('key', ['site_config', 'telegram_settings']);

      if (error) throw error;

      const siteConfigData = settingsData?.find((s: any) => s.key === 'site_config')?.value || {};
      const telegramData = settingsData?.find((s: any) => s.key === 'telegram_settings')?.value || {};

      setSiteConfig(siteConfigData);
      setTelegramSettings(telegramData);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch CMS settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSiteConfig = async () => {
    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('system_settings')
        .update({ 
          value: siteConfig,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'site_config');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Site configuration updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating site config:', error);
      toast({
        title: "Error",
        description: "Failed to update site configuration",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateTelegramSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('system_settings')
        .update({ 
          value: telegramSettings,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'telegram_settings');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Telegram settings updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating telegram settings:', error);
      toast({
        title: "Error",
        description: "Failed to update Telegram settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Content Management</h2>
          <p className="text-muted-foreground">Manage site content and messaging settings</p>
        </div>
        <Button 
          onClick={fetchSettings}
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Site Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Site Configuration
          </CardTitle>
          <CardDescription>
            Configure basic site information and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Site Name</label>
              <Input
                value={siteConfig.site_name}
                onChange={(e) => setSiteConfig(prev => ({
                  ...prev,
                  site_name: e.target.value
                }))}
                placeholder="Trading Fund Portal"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tagline</label>
              <Input
                value={siteConfig.tagline}
                onChange={(e) => setSiteConfig(prev => ({
                  ...prev,
                  tagline: e.target.value
                }))}
                placeholder="Professional Trading Fund Platform"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Email</label>
              <Input
                type="email"
                value={siteConfig.contact_email}
                onChange={(e) => setSiteConfig(prev => ({
                  ...prev,
                  contact_email: e.target.value
                }))}
                placeholder="support@tradingfund.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Support Phone</label>
              <Input
                value={siteConfig.support_phone || ''}
                onChange={(e) => setSiteConfig(prev => ({
                  ...prev,
                  support_phone: e.target.value
                }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Company Address</label>
            <Textarea
              value={siteConfig.address || ''}
              onChange={(e) => setSiteConfig(prev => ({
                ...prev,
                address: e.target.value
              }))}
              placeholder="123 Trading Street, Financial District, NY 10001"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Footer Text</label>
            <Textarea
              value={siteConfig.footer_text || ''}
              onChange={(e) => setSiteConfig(prev => ({
                ...prev,
                footer_text: e.target.value
              }))}
              placeholder="© 2024 Trading Fund Portal. All rights reserved."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">Enable to show maintenance page to users</p>
            </div>
            <Switch
              checked={siteConfig.maintenance_mode || false}
              onCheckedChange={(checked) => setSiteConfig(prev => ({
                ...prev,
                maintenance_mode: checked
              }))}
            />
          </div>

          <Button 
            onClick={updateSiteConfig}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Site Configuration
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Telegram Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Telegram Notifications
          </CardTitle>
          <CardDescription>
            Configure Telegram bot for admin notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bot Token</label>
              <Input
                type="password"
                value={telegramSettings.bot_token}
                onChange={(e) => setTelegramSettings(prev => ({
                  ...prev,
                  bot_token: e.target.value
                }))}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              />
              <p className="text-xs text-muted-foreground">
                Get your bot token from @BotFather on Telegram
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Chat ID</label>
              <Input
                value={telegramSettings.admin_chat_id}
                onChange={(e) => setTelegramSettings(prev => ({
                  ...prev,
                  admin_chat_id: e.target.value
                }))}
                placeholder="-1001234567890"
              />
              <p className="text-xs text-muted-foreground">
                Chat ID where notifications will be sent
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Enable Notifications</p>
              <p className="text-sm text-muted-foreground">Send Telegram notifications for new applications</p>
            </div>
            <Switch
              checked={telegramSettings.notifications_enabled}
              onCheckedChange={(checked) => setTelegramSettings(prev => ({
                ...prev,
                notifications_enabled: checked
              }))}
            />
          </div>

          <Button 
            onClick={updateTelegramSettings}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Telegram Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};