
import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, FileText, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { db } from '../lib/supabase';

export const Reports = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const statsResult = await db.getProcessingStatistics();
    const invoicesResult = await db.getRecentInvoices(50);
    
    if (statsResult.success) {
      setStats(statsResult.data);
    }
    
    if (invoicesResult.success) {
      setRecentInvoices(invoicesResult.data || []);
    }
  };

  // Generate sample data for charts
  const monthlyData = [
    { month: 'Jan', processed: 45, successful: 42 },
    { month: 'Feb', processed: 52, successful: 48 },
    { month: 'Mar', processed: 61, successful: 58 },
    { month: 'Apr', processed: 38, successful: 35 },
    { month: 'May', processed: 67, successful: 63 },
    { month: 'Jun', processed: 73, successful: 70 }
  ];

  const documentTypeData = [
    { name: 'Invoices', value: 65, color: '#3B82F6' },
    { name: 'Receipts', value: 20, color: '#10B981' },
    { name: 'Contracts', value: 10, color: '#F59E0B' },
    { name: 'Statements', value: 5, color: '#EF4444' }
  ];

  const exportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      statistics: stats,
      recentInvoices: recentInvoices.slice(0, 10),
      monthlyData,
      documentTypeData
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-extraction-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center mb-4">
            <BarChart3 className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Reports & Analytics</h1>
          </div>
          <p className="text-xl text-gray-600">
            Comprehensive insights into document processing performance and trends
          </p>
        </div>
        <Button onClick={exportReport} className="flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </Button>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_documents}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_documents > 0 
                  ? Math.round((stats.successful_extractions / stats.total_documents) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fine-tuning Progress</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.progress_percentage}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.records_remaining} records remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3s</div>
              <p className="text-xs text-muted-foreground">
                -0.5s from last month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Processing Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="processed" fill="#3B82F6" name="Processed" />
                <Bar dataKey="successful" fill="#10B981" name="Successful" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={documentTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {documentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate Over Time */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Success Rate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value, name) => [`${((value as number / monthlyData[0].processed) * 100).toFixed(1)}%`, 'Success Rate']} />
              <Line 
                type="monotone" 
                dataKey="successful" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Processed Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Invoice #</th>
                  <th className="text-left p-2">Client</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.slice(0, 10).map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{invoice.invoice_number || 'N/A'}</td>
                    <td className="p-2">{invoice.client_name || 'Unknown'}</td>
                    <td className="p-2">${invoice.total || '0.00'}</td>
                    <td className="p-2">{new Date(invoice.created_at).toLocaleDateString()}</td>
                    <td className="p-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        Processed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
