
import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface JSONValidationDisplayProps {
  data: any;
  validationResult?: {
    isValid: boolean;
    errors: string[];
  };
}

export const JSONValidationDisplay = ({ data, validationResult }: JSONValidationDisplayProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {validationResult?.isValid ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span>Extracted JSON Data</span>
        </CardTitle>
        {validationResult && (
          <div className={`text-sm ${validationResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
            {validationResult.isValid ? 'Valid JSON structure' : 'Validation failed'}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {validationResult && !validationResult.isValid && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
            <ul className="text-sm text-red-700">
              {validationResult.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
          <pre className="text-sm text-gray-800">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};
