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

  // Document type info for header
  const docTypeInfo = {
    invoice: {
      label: 'Invoice Display',
      featured: true,
      description: 'Business invoices, bills, and payment requests',
    },
    statement: {
      label: 'Statement Display',
      featured: true,
      description: 'Financial statements and account summaries',
    },
    receipt: {
      label: 'Receipt Display',
      featured: false,
      description: 'Purchase receipts and transaction records',
    },
    contract: {
      label: 'Contract Display',
      featured: false,
      description: 'Legal contracts and agreements',
    },
    other: {
      label: 'Other Document Display',
      featured: false,
      description: 'Other document types',
    },
  };
  const info = docTypeInfo[documentType as keyof typeof docTypeInfo] || docTypeInfo.other;

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {info.label}
            {info.featured && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs ml-2">
                Featured
              </Badge>
            )}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{info.description}</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800 h-fit">Processed</Badge>
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
