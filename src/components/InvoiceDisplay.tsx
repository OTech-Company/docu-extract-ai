
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { InvoiceData } from '../types';

interface InvoiceDisplayProps {
  data: InvoiceData;
}

export const InvoiceDisplay = ({ data }: InvoiceDisplayProps) => {
  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900">Extracted Data</h4>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Processed
        </Badge>
      </div>

      <div className="grid gap-4">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Number:</span>
                <p className="text-gray-600">{data.invoice.invoice_number}</p>
              </div>
              <div>
                <span className="font-medium">Date:</span>
                <p className="text-gray-600">{data.invoice.invoice_date}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Items ({data.items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.items.slice(0, 2).map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate">{item.description}</span>
                  <span className="font-medium">{item.total_price}</span>
                </div>
              ))}
              {data.items.length > 2 && (
                <p className="text-xs text-gray-500">+{data.items.length - 2} more items</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Amount:</span>
              <span className="text-lg font-bold text-blue-600">{data.subtotal.total}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
