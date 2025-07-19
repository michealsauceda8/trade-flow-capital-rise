
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  FileText,
  Mail,
  Calendar,
  Download
} from 'lucide-react';

interface AnalyticsData {
  applicationTrends: {
    date: string;
    applications: number;
    approved: number;
    rejected: number;
  }[];
  fundingTierStats: {
    tier: string;
    count: number;
    totalAmount: number;
    avgAmount: number;
  }[];
  statusDistribution: {
    status: string;
    count: number;
    percentage: number;
  }[];
  monthlyStats: {
    month: string;
    applications: number;
    funding: number;
    approval_rate: number;
  }[];
}

export const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch applications data
      const { data: applications, error } = await supabase
        .from('applications')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process analytics data
      const processedData = processAnalyticsData(applications || []);
      setAnalytics(processedData);

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processAnalyticsData = (applications: any[]): AnalyticsData => {
    // Application trends by day
    const trendMap = new Map();
    applications.forEach(app => {
      const date = new Date(app.created_at).toISOString().split('T')[0];
      if (!trendMap.has(date)) {
        trendMap.set(date, { date, applications: 0, approved: 0, rejected: 0 });
      }
      const dayData = trendMap.get(date);
      dayData.applications++;
      if (app.status === 'approved') dayData.approved++;
      if (app.status === 'rejected') dayData.rejected++;
    });

    // Funding tier statistics
    const tierMap = new Map();
    applications.forEach(app => {
      if (!tierMap.has(app.funding_tier)) {
        tierMap.set(app.funding_tier, { tier: app.funding_tier, count: 0, totalAmount: 0 });
      }
      const tierData = tierMap.get(app.funding_tier);
      tierData.count++;
      tierData.totalAmount += parseFloat(app.funding_amount || 0);
    });

    const fundingTierStats = Array.from(tierMap.values()).map(tier => ({
      ...tier,
      avgAmount: tier.totalAmount / tier.count
    }));

    // Status distribution
    const statusMap = new Map();
    applications.forEach(app => {
      statusMap.set(app.status, (statusMap.get(app.status) || 0) + 1);
    });

    const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: (count / applications.length) * 100
    }));

    // Monthly statistics
    const monthMap = new Map();
    applications.forEach(app => {
      const month = new Date(app.created_at).toISOString().substring(0, 7);
      if (!monthMap.has(month)) {
        monthMap.set(month, { month, applications: 0, funding: 0, approved: 0, total_decided: 0 });
      }
      const monthData = monthMap.get(month);
      monthData.applications++;
      monthData.funding += parseFloat(app.funding_amount || 0);
      if (app.status === 'approved') monthData.approved++;
      if (app.status === 'approved' || app.status === 'rejected') monthData.total_decided++;
    });

    const monthlyStats = Array.from(monthMap.values()).map(month => ({
      ...month,
      approval_rate: month.total_decided > 0 ? (month.approved / month.total_decided) * 100 : 0
    }));

    return {
      applicationTrends: Array.from(trendMap.values()),
      fundingTierStats,
      statusDistribution,
      monthlyStats
    };
  };

  const exportAnalytics = () => {
    if (!analytics) return;

    const csvData = [
      ['Analytics Report', `Generated: ${new Date().toISOString()}`],
      [''],
      ['Status Distribution'],
      ['Status', 'Count', 'Percentage'],
      ...analytics.statusDistribution.map(item => [item.status, item.count, `${item.percentage.toFixed(1)}%`]),
      [''],
      ['Funding Tier Statistics'],
      ['Tier', 'Count', 'Total Amount', 'Average Amount'],
      ...analytics.fundingTierStats.map(item => [item.tier, item.count, item.totalAmount, item.avgAmount.toFixed(2)]),
      [''],
      ['Monthly Statistics'],
      ['Month', 'Applications', 'Total Funding', 'Approval Rate'],
      ...analytics.monthlyStats.map(item => [item.month, item.applications, item.funding, `${item.approval_rate.toFixed(1)}%`])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 animate-pulse text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h2>
          <p className="text-slate-400">Comprehensive insights and metrics</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 bg-slate-700 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={exportAnalytics}
            variant="outline"
            className="border-green-600 text-green-400 hover:bg-green-600/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Status Distribution */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Application Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {analytics.statusDistribution.map((item) => (
                <div key={item.status} className="flex justify-between items-center">
                  <span className="text-slate-300 capitalize">{item.status.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-white text-sm w-12 text-right">{item.count}</span>
                    <span className="text-slate-400 text-sm w-16 text-right">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {analytics.statusDistribution.reduce((sum, item) => sum + item.count, 0)}
                </div>
                <p className="text-slate-400">Total Applications</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funding Tier Statistics */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Funding Tier Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.fundingTierStats.map((tier) => (
              <div key={tier.tier} className="bg-slate-700/50 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">{tier.tier}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Applications:</span>
                    <span className="text-white">{tier.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Funding:</span>
                    <span className="text-white">${tier.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Amount:</span>
                    <span className="text-white">${tier.avgAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-300 p-2">Month</th>
                  <th className="text-right text-slate-300 p-2">Applications</th>
                  <th className="text-right text-slate-300 p-2">Total Funding</th>
                  <th className="text-right text-slate-300 p-2">Approval Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.monthlyStats.map((month) => (
                  <tr key={month.month} className="border-b border-slate-700/50">
                    <td className="text-white p-2">{month.month}</td>
                    <td className="text-white p-2 text-right">{month.applications}</td>
                    <td className="text-white p-2 text-right">${month.funding.toLocaleString()}</td>
                    <td className="text-white p-2 text-right">
                      <span className={`px-2 py-1 rounded text-sm ${
                        month.approval_rate >= 80 ? 'bg-green-500/20 text-green-400' :
                        month.approval_rate >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {month.approval_rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Application Trends */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Application Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.applicationTrends.slice(-14).map((day) => (
              <div key={day.date} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                <span className="text-slate-300">{new Date(day.date).toLocaleDateString()}</span>
                <div className="flex items-center gap-4">
                  <span className="text-blue-400">Total: {day.applications}</span>
                  <span className="text-green-400">Approved: {day.approved}</span>
                  <span className="text-red-400">Rejected: {day.rejected}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
