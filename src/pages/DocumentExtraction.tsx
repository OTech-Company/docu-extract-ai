import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from '../components/FileUpload';
import { InvoiceDisplay } from '../components/InvoiceDisplay';
import { DocumentTypeSelector } from '../components/DocumentTypeSelector';
import { LanguageSelector } from '../components/LanguageSelector';
import { Loader2, AlertCircle, FileText, Database, CheckCircle } from 'lucide-react';
import { db } from '../lib/supabase';
import { InvoiceData, ProcessedInvoice, ProcessingStatistics } from '../types';

const API_KEYS = [
  "AIzaSyC80ERPHBGH4lFeN8C0aKRO-3TxT64GsEw",
  "AIzaSyBFTcj5Mbns1Eej8xMuVM-T98I-iS_BxnE",
  "AIzaSyCKJ29ZXvolRvFYvaGtdyTX5mhbELwHCxg",
  "AIzaSyBxvMkfwDONvjf2zQz-YmRG5Nm4YLNdo7M",
  "AIzaSyAkyi-DUCnwKYCxwn62fr80FbFvG7r2Yro",
  "AIzaSyCINwfoLC1CfitEns0oHRE63L-eP_L1uIc",
  "AIzaSyAZUMqB4tSfrw5IDd-hliHsZrChiL21QnQ",
  "AIzaSyBKMSM4pPxkrGVDT_Tz2dvxIRM7QPrdykU",
  "AIzaSyAylgpD2TGbLvXt5Wh-qMhe7B-zn3sXK2s",
  "AIzaSyCy7NppzTrbrxSfPS8Or2X2ya62JMRwn8E"
];

// Recursively convert empty string date fields to null within InvoiceData structure
function fixDatesInInvoiceData(data: InvoiceData): InvoiceData {
  const newData = { ...data };

  // Handle top-level invoice dates
  if (newData.invoice) {
    if (typeof newData.invoice.invoice_date === 'string' && newData.invoice.invoice_date.trim() === '') {
      newData.invoice.invoice_date = null;
    }
    if (typeof newData.invoice.due_date === 'string' && newData.invoice.due_date.trim() === '') {
      newData.invoice.due_date = null;
    }
  }

  // Handle payment_instructions due_date
  if (newData.payment_instructions) {
    if (typeof newData.payment_instructions.due_date === 'string' && newData.payment_instructions.due_date.trim() === '') {
      newData.payment_instructions.due_date = null;
    }
  }

  // Handle items array - assuming no dates directly in items, but good to show pattern
  if (Array.isArray(newData.items)) {
    newData.items = newData.items.map(item => {
      // If items had nested date objects, you'd recurse here
      return item;
    });
  }

  // No dates expected in subtotal directly, but for completeness
  if (newData.subtotal) {
    // if (typeof newData.subtotal.some_date_field === 'string' && newData.subtotal.some_date_field.trim() === '') {
    //   newData.subtotal.some_date_field = null;
    // }
  }

  return newData;
}

export const DocumentExtraction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [processedInvoices, setProcessedInvoices] = useState<ProcessedInvoice[]>([]);
  const [processingStats, setProcessingStats] = useState<ProcessingStatistics | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [documentType, setDocumentType] = useState('invoice');
  const [language, setLanguage] = useState('english');

  useEffect(() => {
    loadProcessingStats();
    loadRecentInvoices();
  }, []);

  const loadProcessingStats = async () => {
    const result = await db.getProcessingStatistics();
    if (result.success) {
      setProcessingStats(result.data);
    }
  };

  const loadRecentInvoices = async () => {
    const result = await db.getRecentInvoices(10);
    if (result.success) {
      console.log('Raw data from db.getRecentInvoices:', result.data);
      // Add timestamp fallback for database records that don't have it
      const invoicesWithTimestamp = (result.data || []).map(invoice => ({
        ...invoice,
        timestamp: Date.now()
      }));
      setProcessedInvoices(invoicesWithTimestamp);
    }
  };

  const processDocument = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setSaveStatus('idle');
    let currentKeyIndex = 0;

    try {
      // Save document processing record
      const docResult = await db.saveDocumentProcessing({
        fileName: file.name,
        fileSize: file.size,
        documentType,
        language
      });

      if (!docResult.success) {
        throw new Error('Failed to save document record');
      }

      const documentId = docResult.data.id;

      const processWithApiKey = async (apiKey: string) => {
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

          const requestBody = {
            contents: [
              {
                parts: [
                  {
                    text: `You must output a strictly valid JSON object with no extra text, markdown formatting, or comments. Your JSON object must have exactly the following keys and nested structure (do not add, omit, or change any keys):
                    {
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
                    IMPORTANT: Do not copy the example above. Instead, extract the actual data from the provided document image and fill in the fields with the real values. If a value is missing, use an empty string. Process this ${documentType} document in ${language} language. All property names and string values must be enclosed in double quotes.`
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

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody)
            }
          );

          if (!response.ok) {
            if (response.status === 403 || response.status === 429) {
              if (currentKeyIndex < API_KEYS.length - 1) {
                currentKeyIndex++;
                return processWithApiKey(API_KEYS[currentKeyIndex]);
              }
            }
            throw new Error('Failed to process document');
          }

          const result = await response.json();
          console.log('Gemini API raw response:', result);
          const jsonStr = result.candidates[0].content.parts[0].text;
          const cleanedJsonStr = jsonStr
            .replace(/```json[\s\S]*?({[\s\S]*})[\s\S]*?```/i, '$1')
            .replace(/```[\s\S]*?({[\s\S]*})[\s\S]*?```/g, '$1')
            .replace(/^[\s`]+|[\s`]+$/g, '')
            .replace(/^json\s*/i, '')
            .trim();
          console.log('Cleaned JSON string:', cleanedJsonStr);
          let data: InvoiceData;
          try {
            data = JSON.parse(cleanedJsonStr);
            console.log('Parsed InvoiceData:', data);
          } catch (parseErr) {
            setError('Failed to parse JSON: ' + (parseErr instanceof Error ? parseErr.message : String(parseErr)));
            setIsLoading(false);
            return;
          }

          const fixedData = fixDatesInInvoiceData(data);
          console.log('Fixed InvoiceData (empty dates should be null):', fixedData);

          // Save to database
          setSaveStatus('saving');
          const saveResult = await db.saveExtractedInvoice({
            documentId,
            ...fixedData
          });
          
          if (saveResult.success) {
            setSaveStatus('saved');
            await db.updateStatistics();
            await loadProcessingStats();
            await loadRecentInvoices();
          } else {
            setSaveStatus('error');
            setError('Failed to save to database: ' + JSON.stringify(saveResult.error || 'Unknown error'));
          }

          setCurrentInvoice(data);
        } catch (err) {
          setSaveStatus('error');
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      };

      await processWithApiKey(API_KEYS[currentKeyIndex]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [documentType, language]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <FileText className="w-12 h-12 text-blue-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">Document Data Extraction</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upload documents and extract structured data using advanced AI vision technology
        </p>
      </div>

      {/* Processing Statistics */}
      {processingStats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Database className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Processing Statistics</h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {processingStats.total_documents}/{processingStats.fine_tuning_threshold}
              </div>
              <div className="text-sm text-gray-600">Documents processed</div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress to fine-tuning threshold</span>
              <span>{processingStats.progress_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(processingStats.progress_percentage, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-md p-3">
              <div className="font-medium text-gray-900">Total Documents</div>
              <div className="text-2xl font-bold text-blue-600">{processingStats.total_documents}</div>
            </div>
            <div className="bg-white rounded-md p-3">
              <div className="font-medium text-gray-900">Records Remaining</div>
              <div className="text-2xl font-bold text-orange-600">{processingStats.records_remaining}</div>
            </div>
            <div className="bg-white rounded-md p-3">
              <div className="font-medium text-gray-900">Fine-tuning Status</div>
              <div className={`text-lg font-bold ${processingStats.fine_tuning_ready ? 'text-green-600' : 'text-gray-500'}`}>
                {processingStats.fine_tuning_ready ? 'Ready' : 'Not Ready'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Type and Language Selectors */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <DocumentTypeSelector 
          value={documentType} 
          onChange={setDocumentType} 
        />
        <LanguageSelector 
          value={language} 
          onChange={setLanguage} 
        />
      </div>

      <FileUpload onFileSelect={processDocument} isLoading={isLoading} />

      {/* Status Messages */}
      <div className="flex justify-center mt-6 space-x-4">
        {isLoading && (
          <div className="flex items-center text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span>Processing document...</span>
          </div>
        )}

        {saveStatus === 'saving' && (
          <div className="flex items-center text-orange-600">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span>Saving to database...</span>
          </div>
        )}

        {saveStatus === 'saved' && (
          <div className="flex items-center text-green-600">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>Successfully saved to database!</span>
          </div>
        )}

        {(error || saveStatus === 'error') && (
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error || 'Failed to save to database'}</span>
          </div>
        )}
      </div>

      {/* Current Invoice Display */}
      {currentInvoice && !isLoading && (
        <div className="mt-8">
          <InvoiceDisplay data={currentInvoice} />
        </div>
      )}

      {/* Recent Documents */}
      {processedInvoices.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recent Documents</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {processedInvoices.map(invoice => (
              <div
                key={invoice.id}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      #{invoice.invoice_number || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {invoice.client_name || 'Unknown Client'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600 text-lg">
                      ${invoice.total || '0.00'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{invoice.invoice_date || 'No date'}</span>
                  <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
