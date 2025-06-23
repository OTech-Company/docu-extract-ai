import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatementDisplayProps {
  data: Record<string, any>;
}

export const StatementDisplay = ({ data }: StatementDisplayProps) => {
  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };
  const formatKey = (key: string): string => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Statement Display
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs ml-2">
              Featured
            </Badge>
          </h3>
          <p className="text-sm text-gray-600 mt-1">Financial statements and account summaries</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800 h-fit">Processed</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Statement Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="border-b border-gray-100 pb-2 last:border-b-0">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-700">{formatKey(key)}:</span>
                <p className="text-sm text-gray-600 break-words">{renderValue(value)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}; 