import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { InvoiceData } from '../types';

interface InvoiceDisplayProps {
  data: InvoiceData;
}

export const InvoiceDisplay = ({ data }: InvoiceDisplayProps) => {
  if (!data || !data.invoice || !data.items || !data.subtotal) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded">
        Incomplete or invalid invoice data.
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Invoice Display
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs ml-2">
              Featured
            </Badge>
          </h3>
          <p className="text-sm text-gray-600 mt-1">Business invoices, bills, and payment requests</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800 h-fit">Processed</Badge>
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
