
import React, { useState, useCallback } from 'react';
import { FileUpload } from './FileUpload';
import { InvoiceDisplay } from './InvoiceDisplay';
import { DocumentTypeSelector } from './DocumentTypeSelector';
import { LanguageSelector } from './LanguageSelector';
import { Loader2, AlertCircle } from 'lucide-react';
import type { InvoiceData, ProcessedInvoice } from '../types';

const API_KEY = "AIzaSyBxvMkfwDONvjf2zQz-YmRG5Nm4YLNdo7M";

export const DocumentExtractor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [processedInvoices, setProcessedInvoices] = useState<ProcessedInvoice[]>([]);
  const [documentType, setDocumentType] = useState('invoice');
  const [language, setLanguage] = useState('english');

  const processInvoice = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert image to base64
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Construct the request body for the Gemini API
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `You must output a strictly valid JSON object with no extra text, markdown formatting, or comments. Your JSON object must have exactly the following keys and nested structure (do not add, omit, or change any keys): {
                  "invoice": {
                    "client_name": "<string>",
                    "client_address": "<string>",
                    "seller_name": "<string>",
                    "seller_address": "<string>",
                    "invoice_number": "<string>",
                    "invoice_date": "<string>",
                    "due_date": "<string>"
                  },
                  "items": [
                    {
                      "description": "<string>",
                      "quantity": "<string>",
                      "total_price": "<string>"
                    }
                  ],
                  "subtotal": {
                    "tax": "<string>",
                    "discount": "<string>",
                    "total": "<string>"
                  },
                  "payment_instructions": {
                    "due_date": "<string>",
                    "bank_name": "<string>",
                    "account_number": "<string>",
                    "payment_method": "<string>"
                  }
                }
                Process this ${documentType} document in ${language} language. All property names and string values must be enclosed in double quotes.`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ]
      };

      // Send the request to the Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error response:", errorText);
        throw new Error('Failed to process document');
      }

      const result = await response.json();
      const jsonStr = result.candidates[0].content.parts[0].text;
      const data: InvoiceData = JSON.parse(jsonStr);

      // Add to history
      const processedInvoice: ProcessedInvoice = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      };

      setProcessedInvoices(prev => [processedInvoice, ...prev]);
      setCurrentInvoice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [documentType, language]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Try Document Extraction
        </h3>
        <p className="text-gray-600 text-sm">
          Upload a document and see our AI extract structured data instantly
        </p>
      </div>

      {/* Document Type and Language Selectors */}
      <div className="grid grid-cols-2 gap-4">
        <DocumentTypeSelector 
          value={documentType} 
          onChange={setDocumentType} 
        />
        <LanguageSelector 
          value={language} 
          onChange={setLanguage} 
        />
      </div>

      <FileUpload onFileSelect={processInvoice} isLoading={isLoading} />

      {/* Status Messages */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600 text-sm">Processing document...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-4 text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Current Invoice Display */}
      {currentInvoice && !isLoading && (
        <div className="mt-6">
          <InvoiceDisplay data={currentInvoice} />
        </div>
      )}
    </div>
  );
};
