
import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, FileText, Database, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { db } from '../lib/supabase';

export const Reports = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const result = await db.getComprehensiveAnalytics();
      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!analytics) return;

    const reportData = {
      timestamp: new Date().toISOString(),
      overview: analytics.overview,
      document_types: analytics.document_types,
      languages: analytics.languages,
      recent_documents: analytics.recent_documents.slice(0, 20),
      summary: {
        total_documents: analytics.overview.total_documents,
        success_rate: analytics.overview.success_rate,
        avg_confidence: analytics.overview.avg_confidence_score,
        avg_processing_time: `${Math.round(analytics.overview.avg_processing_time_ms / 1000 * 10) / 10}s`,
        fine_tuning_progress: analytics.overview.progress_percentage
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprehensive-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateChartData = () => {
    if (!analytics) return { monthlyData: [], documentTypeData: [], languageData: [], statusData: [] };

    // Generate monthly data from actual documents
    const documents = analytics.all_documents || [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = targetDate.getMonth();
      const year = targetDate.getFullYear();
      const monthName = monthNames[monthIndex];
      
      const monthDocs = documents.filter(doc => {
        const docDate = new Date(doc.created_at);
        return docDate.getMonth() === monthIndex && docDate.getFullYear() === year;
      });

      const processed = monthDocs.length;
      const successful = monthDocs.filter(doc => doc.final_status === 'success').length;
      const failed = monthDocs.filter(doc => doc.final_status === 'failed').length;

      monthlyData.push({
        month: monthName,
        processed,
        successful,
        failed
      });
    }

    // Document type distribution
    const documentTypeData = Object.entries(analytics.document_types).map(([type, count], index) => {
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
      return {
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: count,
        color: colors[index % colors.length]
      };
    });

    // Language distribution
    const languageData = Object.entries(analytics.languages).map(([lang, count], index) => {
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      return {
        name: lang.toUpperCase(),
        value: count,
        color: colors[index % colors.length]
      };
    });

    // Status distribution
    const overview = analytics.overview;
    const statusData = [
      { name: 'Successful', value: overview.successful_extractions, color: '#10B981' },
      { name: 'Failed', value: overview.failed_extractions, color: '#EF4444' },
      { name: 'In Progress', value: overview.in_progress_extractions, color: '#F59E0B' }
    ].filter(item => item.value > 0);

    return { monthlyData, documentTypeData, languageData, statusData };
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading comprehensive analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Failed to load analytics data</p>
          <Button onClick={loadAnalytics} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  const { monthlyData, documentTypeData, languageData, statusData } = generateChartData();
  const { overview } = analytics;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center mb-4">
            <BarChart3 className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Comprehensive Analytics</h1>
          </div>
          <p className="text-xl text-gray-600">
            Complete insights into document processing performance and database activity
          </p>
        </div>
        <div className="flex space-x-4">
          <Button onClick={loadAnalytics} variant="outline">
            <Database className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_documents}</div>
            <p className="text-xs text-muted-foreground">
              {overview.total_processing_attempts} total attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.success_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {overview.successful_extractions} successful / {overview.failed_extractions} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OCR Confidence</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.avg_confidence_score}%</div>
            <p className="text-xs text-muted-foreground">
              Average OCR confidence score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(overview.avg_processing_time_ms / 1000 * 10) / 10}s
            </div>
            <p className="text-xs text-muted-foreground">
              Per document processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trends */}
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
                <Bar dataKey="processed" fill="#3B82F6" name="Total Processed" />
                <Bar dataKey="successful" fill="#10B981" name="Successful" />
                <Bar dataKey="failed" fill="#EF4444" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Processing Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Document Types */}
        <Card>
          <CardHeader>
            <CardTitle>Document Types</CardTitle>
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
                  label={({ name, value }) => `${name}: ${value}`}
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

        {/* Languages */}
        <Card>
          <CardHeader>
            <CardTitle>Language Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={languageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Fine-tuning Progress */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Fine-tuning Dataset Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress to fine-tuning threshold</span>
              <span className="text-sm text-gray-500">
                {overview.total_documents} / 500 documents
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, overview.progress_percentage)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{overview.progress_percentage}% complete</span>
              <span>{overview.records_remaining} records remaining</span>
            </div>
            {overview.fine_tuning_ready && (
              <Badge className="bg-green-100 text-green-800">
                Ready for fine-tuning!
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Document Processing Details</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recent_documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents processed yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>OCR Confidence</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.recent_documents.slice(0, 20).map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {doc.file_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {doc.document_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{doc.language.toUpperCase()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {doc.final_status === 'success' && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {doc.final_status === 'failed' && (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          {doc.final_status === 'pending' && (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          )}
                          <span className="text-sm">
                            {doc.final_status || doc.processing_status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.ocr_confidence 
                          ? `${Math.round(doc.ocr_confidence * 10000) / 100}%`
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>{doc.processing_attempts || 1}</TableCell>
                      <TableCell>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
