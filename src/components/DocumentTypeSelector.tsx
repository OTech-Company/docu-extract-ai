
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Receipt, FileCheck, CreditCard } from 'lucide-react';

interface DocumentTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const DocumentTypeSelector = ({ value, onChange }: DocumentTypeSelectorProps) => {
  const documentTypes = [
    { value: 'invoice', label: 'Invoice', icon: FileText },
    { value: 'receipt', label: 'Receipt', icon: Receipt },
    { value: 'contract', label: 'Contract', icon: FileCheck },
    { value: 'statement', label: 'Statement', icon: CreditCard },
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Document Type</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select document type" />
        </SelectTrigger>
        <SelectContent>
          {documentTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              <div className="flex items-center space-x-2">
                <type.icon className="w-4 h-4" />
                <span>{type.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
