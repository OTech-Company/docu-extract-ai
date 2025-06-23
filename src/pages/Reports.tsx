import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, FileText, Database, Clock, Languages } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';
import { db } from '../lib/supabase';

interface Document {
  id: string;
  file_name: string;
  file_size: number;
  document_type: string;
  language: string;
  processing_status: string;
  created_at: string;
  processing_steps?: any[];
  ocr_results?: any[];
  extracted_invoices?: any[];
}

interface ProcessingStep {
  id: string;
  document_id: string;
  step_name: string;
  status: string;
  processing_time_ms: number;
  created_at: string;
  document_processing: {
    document_type: string;
    language: string;
    created_at: string;
  };
}

export const Reports = () => {
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Derived data
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [documentTypeData, setDocumentTypeData] = useState<any[]>([]);
  const [languageData, setLanguageData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (allDocuments.length > 0) {
      generateChartData();
    }
  }, [allDocuments, processingSteps, selectedDocumentType, selectedLanguage]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [documentsResult, stepsResult, statsResult] = await Promise.all([
        db.getAllDocuments(1000),
        db.getProcessingStepsAnalytics(),
        db.getProcessingStatistics()
      ]);

      if (documentsResult.success) {
        setAllDocuments(documentsResult.data || []);
      }

      if (stepsResult.success) {
        setProcessingSteps(stepsResult.data || []);
      }

      if (statsResult.success) {
        setStats(statsResult.data);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = () => {
    const filteredDocuments = filterDocuments(allDocuments);
    const filteredSteps = filterProcessingSteps(processingSteps);

    // Generate monthly data
    const monthlyStats = generateMonthlyStats(filteredDocuments);
    setMonthlyData(monthlyStats);

    // Generate document type distribution
    const typeDistribution = generateDocumentTypeDistribution(filteredDocuments);
    setDocumentTypeData(typeDistribution);

    // Generate language distribution
    const langDistribution = generateLanguageDistribution(filteredDocuments);
    setLanguageData(langDistribution);

    // Generate performance data
    const perfData = generatePerformanceData(filteredSteps);
    setPerformanceData(perfData);

    // Generate status distribution
    const statusDistribution = generateStatusDistribution(filteredDocuments);
    setStatusData(statusDistribution);
  };

  const filterDocuments = (documents: Document[]) => {
    return documents.filter(doc => {
      const typeMatch = selectedDocumentType === 'all' || doc.document_type === selectedDocumentType;
      const langMatch = selectedLanguage === 'all' || doc.language === selectedLanguage;
      return typeMatch && langMatch;
    });
  };

  const filterProcessingSteps = (steps: ProcessingStep[]) => {
    return steps.filter(step => {
      const typeMatch = selectedDocumentType === 'all' || step.document_processing.document_type === selectedDocumentType;
      const langMatch = selectedLanguage === 'all' || step.document_processing.language === selectedLanguage;
      return typeMatch && langMatch;
    });
  };

  const generateMonthlyStats = (documents: Document[]) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyStats = [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = targetDate.getMonth();
      const year = targetDate.getFullYear();
      const monthName = monthNames[monthIndex];

      const monthDocuments = documents.filter(doc => {
        const docDate = new Date(doc.created_at);
        return docDate.getMonth() === monthIndex && docDate.getFullYear() === year;
      });

      const processed = monthDocuments.length;
      const successful = monthDocuments.filter(doc => 
        doc.processing_status === 'completed' || doc.processing_status === 'successful'
      ).length;
      const failed = monthDocuments.filter(doc => 
        doc.processing_status === 'failed' || doc.processing_status === 'error'
      ).length;

      monthlyStats.push({
        month: monthName,
        processed,
        successful,
        failed,
        successRate: processed > 0 ? Math.round((successful / processed) * 100) : 0
      });
    }

    return monthlyStats;
  };

  const generateDocumentTypeDistribution = (documents: Document[]) => {
    const typeCount = documents.reduce((acc, doc) => {
      acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];
    
    return Object.entries(typeCount).map(([type, count], index) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: colors[index % colors.length]
    }));
  };

  const generateLanguageDistribution = (documents: Document[]) => {
    const langCount = documents.reduce((acc, doc) => {
      acc[doc.language] = (acc[doc.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    
    return Object.entries(langCount).map(([lang, count], index) => ({
      name: lang.toUpperCase(),
      value: count,
      color: colors[index % colors.length]
    }));
  };

  const generatePerformanceData = (steps: ProcessingStep[]) => {
    const stepGroups = steps.reduce((acc, step) => {
      if (!acc[step.step_name]) {
        acc[step.step_name] = [];
      }
      acc[step.step_name].push(step.processing_time_ms);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(stepGroups).map(([stepName, times]) => ({
      step: stepName,
      avgTime: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      count: times.length
    }));
  };

  const generateStatusDistribution = (documents: Document[]) => {
    const statusCount = documents.reduce((acc, doc) => {
      acc[doc.processing_status] = (acc[doc.processing_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusColors = {
      'completed': '#10B981',
      'successful': '#10B981',
      'processing': '#F59E0B',
      'pending': '#6B7280',
      'failed': '#EF4444',
      'error': '#EF4444'
    };

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: statusColors[status] || '#6B7280'
    }));
  };

  const exportReport = () => {
    const filteredDocuments = filterDocuments(allDocuments);
    const reportData = {
      timestamp: new Date().toISOString(),
      filters: {
        documentType: selectedDocumentType,
        language: selectedLanguage
      },
      summary: {
        totalDocuments: filteredDocuments.length,
        successfulDocuments: filteredDocuments.filter(d => d.processing_status === 'completed' || d.processing_status === 'successful').length,
        failedDocuments: filteredDocuments.filter(d => d.processing_status === 'failed' || d.processing_status === 'error').length,
        successRate: filteredDocuments.length > 0 
          ? Math.round((filteredDocuments.filter(d => d.processing_status === 'completed' || d.processing_status === 'successful').length / filteredDocuments.length) * 100)
          : 0
      },
      chartData: {
        monthlyData,
        documentTypeData,
        languageData,
        performanceData,
        statusData
      },
      recentDocuments: filteredDocuments.slice(0, 20).map(doc => ({
        fileName: doc.file_name,
        type: doc.document_type,
        language: doc.language,
        status: doc.processing_status,
        size: doc.file_size,
        processedAt: doc.created_at
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-processing-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getUniqueDocumentTypes = () => {
    return [...new Set(allDocuments.map(doc => doc.document_type))];
  };

  const getUniqueLanguages = () => {
    return [...new Set(allDocuments.map(doc => doc.language))];
  };

  const filteredDocuments = filterDocuments(allDocuments);
  const successfulDocs = filteredDocuments.filter(d => d.processing_status === 'completed' || d.processing_status === 'successful');
  const failedDocs = filteredDocuments.filter(d => d.processing_status === 'failed' || d.processing_status === 'error');

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center mb-4">
            <BarChart3 className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Document Processing Analytics</h1>
          </div>
          <p className="text-xl text-gray-600">
            Comprehensive insights into all document processing activities
          </p>
        </div>
        <Button onClick={exportReport} className="flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-8">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Document Type:</label>
          <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {getUniqueDocumentTypes().map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Language:</label>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {getUniqueLanguages().map(lang => (
                <SelectItem key={lang} value={lang}>
                  {lang.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              {allDocuments.length} total across all filters
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
              {filteredDocuments.length > 0 
                ? Math.round((successfulDocs.length / filteredDocuments.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {successfulDocs.length} successful, {failedDocs.length} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Document Types</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUniqueDocumentTypes().length}</div>
            <p className="text-xs text-muted-foreground">
              Different document types processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Languages</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUniqueLanguages().length}</div>
            <p className="text-xs text-muted-foreground">
              Languages supported
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
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
                <Bar dataKey="failed" fill="#EF4444" name="Failed" />
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

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                <Bar dataKey="value" fill="#8B5CF6" name="Documents" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Processing Performance Chart */}
      {performanceData.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Processing Step Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="step" />
                <YAxis />
                <Tooltip formatter={(value, name) => [`${value}ms`, name]} />
                <Bar dataKey="avgTime" fill="#06B6D4" name="Avg Time" />
                <Bar dataKey="maxTime" fill="#EF4444" name="Max Time" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      

      {/* Recent Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Processed Documents ({filteredDocuments.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents found with current filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">File Name</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Language</th>
                    <th className="text-left p-2">Size</th>
                    <th className="text-left p-2">Processed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.slice(0, 20).map((doc) => (
                    <tr key={doc.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium truncate max-w-xs" title={doc.file_name}>
                        {doc.file_name}
                      </td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {doc.document_type}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                          {doc.language.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2">{(doc.file_size / 1024).toFixed(1)} KB</td>
                      
                      <td className="p-2">{new Date(doc.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};