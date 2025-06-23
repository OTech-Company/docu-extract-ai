
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GenericDocumentData } from '../types';

interface GenericDocumentDisplayProps {
  data: GenericDocumentData;
  documentType: string;
}

export const GenericDocumentDisplay = ({ data, documentType }: GenericDocumentDisplayProps) => {
  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const formatKey = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900">Extracted Data</h4>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Processed
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{formatKey(documentType)} Information</CardTitle>
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
