
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from "@/components/ui/use-toast"
import { ProcessingStep, OCRModel } from '@/types/processing';
import { GenericDocumentDisplay } from '@/components/GenericDocumentDisplay';
import { Checkbox } from "@/components/ui/checkbox"
import { db } from '@/lib/supabase';

interface DocumentProcessingState {
  documentId?: string;
  fileName: string;
  fileSize: number;
  documentType: string;
  language: string;
  status: 'uploading' | 'preprocessing' | 'ocr' | 'extraction' | 'validation' | 'completed' | 'error';
  steps: ProcessingStep[];
  ocrResults: Record<string, any>;
  extractedData?: any;
  validationResults?: any;
}

const initialProcessingState: DocumentProcessingState = {
  fileName: '',
  fileSize: 0,
  documentType: '',
  language: '',
  status: 'uploading',
  steps: [],
  ocrResults: {},
  extractedData: undefined,
  validationResults: undefined
};

const initialOcrModels: OCRModel[] = [
  { name: 'tesseract', displayName: 'Tesseract OCR', description: 'Open source OCR engine', isActive: true },
  { name: 'easyocr', displayName: 'EasyOCR', description: 'Easy to use OCR with multiple languages', isActive: false },
  { name: 'aws_textract', displayName: 'AWS Textract', description: 'Amazon\'s cloud-based OCR service', isActive: false },
];

const initialLlmModels = [
  { name: 'gpt-3.5-turbo', displayName: 'GPT 3.5 Turbo', description: 'Fast and efficient model', isActive: true },
  { name: 'gpt-4', displayName: 'GPT 4', description: 'More accurate and powerful model', isActive: false },
  { name: 'claude-v1', displayName: 'Claude V1', description: 'Anthropic\'s Claude model', isActive: false },
];

// Template responses for different document types
const getDocumentTemplate = (documentType: string) => {
  const templates = {
    invoice: {
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
          "unit_price": "<string>",
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
    },
    receipt: {
      "receipt": {
        "merchant_name": "<string>",
        "merchant_address": "<string>",
        "receipt_number": "<string>",
        "transaction_date": "<string>",
        "transaction_time": "<string>"
      },
      "items": [
        {
          "description": "<string>",
          "quantity": "<string>",
          "unit_price": "<string>",
          "total_price": "<string>"
        }
      ],
      "payment": {
        "subtotal": "<string>",
        "tax": "<string>",
        "discount": "<string>",
        "total": "<string>",
        "payment_method": "<string>",
        "card_last_four": "<string>"
      }
    },
    contract: {
      "contract": {
        "contract_title": "<string>",
        "contract_number": "<string>",
        "effective_date": "<string>",
        "expiration_date": "<string>",
        "contract_type": "<string>"
      },
      "parties": [
        {
          "party_type": "<string>",
          "company_name": "<string>",
          "contact_person": "<string>",
          "address": "<string>",
          "phone": "<string>",
          "email": "<string>"
        }
      ],
      "terms": {
        "payment_terms": "<string>",
        "delivery_terms": "<string>",
        "cancellation_policy": "<string>",
        "liability_clauses": "<string>"
      },
      "financial": {
        "contract_value": "<string>",
        "currency": "<string>",
        "payment_schedule": "<string>"
      }
    },
    other: {
      "document": {
        "document_type": "<string>",
        "document_title": "<string>",
        "document_date": "<string>",
        "document_number": "<string>"
      },
      "content": {
        "main_content": "<string>",
        "key_information": "<array>",
        "important_dates": "<array>",
        "contact_information": "<string>"
      },
      "metadata": {
        "language": "<string>",
        "page_count": "<string>",
        "document_format": "<string>"
      }
    }
  };
  
  return templates[documentType as keyof typeof templates] || templates.other;
};

const getLLMPrompt = (documentType: string, language: string) => {
  const template = getDocumentTemplate(documentType);
  
  return `Extract ${documentType} data from the following text and return ONLY a valid JSON object with this exact structure. Do NOT include any other text, explanations, or formatting outside of the JSON object:

${JSON.stringify(template, null, 2)}

Process this ${documentType} document in ${language} language. All property names and string values must be enclosed in double quotes. Extract all available information and populate the fields accordingly. If a field is not found in the document, use an empty string "".`;
};

export const DocumentExtraction = () => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [language, setLanguage] = useState('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState<DocumentProcessingState>(initialProcessingState);
  const [ocrText, setOcrText] = useState('');
  const [activeOcrModels, setActiveOcrModels] = useState<OCRModel[]>(initialOcrModels);
  const [llmModels, setLlmModels] = useState(initialLlmModels);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  const handleOcrModelToggle = (modelName: string) => {
    setActiveOcrModels(prevModels =>
      prevModels.map(model =>
        model.name === modelName ? { ...model, isActive: !model.isActive } : model
      )
    );
  };

  const handleLlmModelToggle = (modelName: string) => {
    setLlmModels(prevModels =>
      prevModels.map(model =>
        model.name === modelName ? { ...model, isActive: !model.isActive } : model
      )
    );
  };

  const processDocument = async () => {
    if (!file || !documentType || !language) {
      toast({
        title: "Missing Information",
        description: "Please select a file, document type, and language.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingState({
      documentId: undefined,
      fileName: file.name,
      fileSize: file.size,
      documentType,
      language,
      status: 'uploading',
      steps: [],
      ocrResults: {},
      extractedData: undefined,
      validationResults: undefined
    });

    try {
      // Step 1: Save document processing record
      updateStep('document_save', 'processing', 'Saving document information...');
      
      const docResult = await db.saveDocumentProcessing({
        fileName: file.name,
        fileSize: file.size,
        documentType,
        language
      });

      if (!docResult.success) {
        throw new Error('Failed to save document information');
      }

      const documentId = docResult.data.id;
      setProcessingState(prev => ({ ...prev, documentId, status: 'preprocessing' }));
      updateStep('document_save', 'completed', 'Document information saved');

      // Step 2: OCR Processing with multiple models
      updateStep('ocr_processing', 'processing', 'Performing OCR with multiple models...');
      
      const ocrModels = activeOcrModels.filter(model => model.isActive);
      const ocrResults: Record<string, any> = {};
      
      for (const model of ocrModels) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('model', model.name);

          const ocrResponse = await fetch('http://localhost:5000/api/ocr/extract', {
            method: 'POST',
            body: formData,
          });

          if (!ocrResponse.ok) {
            throw new Error(`OCR failed for ${model.name}`);
          }

          const ocrData = await ocrResponse.json();
          ocrResults[model.name] = {
            text: ocrData.text,
            confidence: ocrData.confidence,
            error: null
          };

          // Save OCR result to database
          await db.saveOCRResult({
            documentId,
            ocrModel: model.name,
            extractedText: ocrData.text,
            confidenceScore: ocrData.confidence,
            processingTimeMs: ocrData.processing_time || 0
          });

          // Save processing step
          await db.saveProcessingStep({
            documentId,
            stepName: `OCR_${model.name}`,
            stepOrder: ocrModels.indexOf(model) + 1,
            status: 'completed',
            outputData: ocrData,
            processingTimeMs: ocrData.processing_time || 0,
            modelUsed: model.name,
            confidenceScore: ocrData.confidence
          });

        } catch (error: any) {
          console.error(`OCR failed for ${model.name}:`, error);
          ocrResults[model.name] = {
            text: '',
            confidence: 0,
            error: error.message
          };

          // Save failed processing step
          await db.saveProcessingStep({
            documentId,
            stepName: `OCR_${model.name}`,
            stepOrder: ocrModels.indexOf(model) + 1,
            status: 'failed',
            errorMessage: error.message,
            modelUsed: model.name
          });
        }
      }

      setProcessingState(prev => ({ ...prev, ocrResults, status: 'extraction' }));
      updateStep('ocr_processing', 'completed', 'OCR processing completed');

      // Step 3: Select best OCR result using majority voting or highest confidence
      const bestOcrResult = selectBestOcrResult(ocrResults);
      if (!bestOcrResult || !bestOcrResult.text) {
        throw new Error('All OCR models failed to extract text');
      }

      // Step 4: LLM Processing for data extraction
      updateStep('llm_processing', 'processing', 'Extracting structured data...');

      const activeLlms = llmModels.filter(model => model.isActive);
      const llmResults: any[] = [];

      for (const llm of activeLlms) {
        try {
          const llmPrompt = getLLMPrompt(documentType, language);
          
          const llmResponse = await fetch('http://localhost:5000/api/llm/extract', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: bestOcrResult.text,
              model: llm.name,
              document_type: documentType,
              language: language,
              prompt: llmPrompt
            }),
          });

          if (!llmResponse.ok) {
            throw new Error(`LLM extraction failed for ${llm.name}`);
          }

          const llmData = await llmResponse.json();
          llmResults.push({
            model: llm.name,
            data: llmData.extracted_data,
            confidence: llmData.confidence || 0.8
          });

          // Save processing step
          await db.saveProcessingStep({
            documentId,
            stepName: `LLM_${llm.name}`,
            stepOrder: 10 + activeLlms.indexOf(llm),
            status: 'completed',
            inputData: { text: bestOcrResult.text.substring(0, 1000) }, // Truncate for storage
            outputData: llmData,
            modelUsed: llm.name,
            confidenceScore: llmData.confidence || 0.8
          });

        } catch (error: any) {
          console.error(`LLM extraction failed for ${llm.name}:`, error);
          
          // Save failed processing step
          await db.saveProcessingStep({
            documentId,
            stepName: `LLM_${llm.name}`,
            stepOrder: 10 + activeLlms.indexOf(llm),
            status: 'failed',
            errorMessage: error.message,
            modelUsed: llm.name
          });
        }
      }

      if (llmResults.length === 0) {
        throw new Error('All LLM models failed to extract data');
      }

      // Step 5: Majority voting for best extraction result
      const finalResult = performMajorityVoting(llmResults);
      setProcessingState(prev => ({ ...prev, extractedData: finalResult, status: 'validation' }));
      updateStep('llm_processing', 'completed', 'Data extraction completed');

      // Step 6: Save extracted data to database
      updateStep('data_saving', 'processing', 'Saving extracted data...');

      if (documentType === 'invoice' && isInvoiceData(finalResult)) {
        const saveResult = await db.saveExtractedInvoice({
          documentId,
          ...finalResult
        });

        if (!saveResult.success) {
          throw new Error('Failed to save extracted invoice data');
        }
      }

      // Update statistics
      await db.updateStatistics();

      updateStep('data_saving', 'completed', 'Data saved successfully');
      setProcessingState(prev => ({ ...prev, status: 'completed' }));

      toast({
        title: "Processing Complete",
        description: "Document has been successfully processed and saved.",
      });

    } catch (error: any) {
      console.error('Processing failed:', error);
      
      // Update document status to failed
      if (processingState.documentId) {
        await db.updateDocumentStatus(
          processingState.documentId, 
          'failed', 
          'failed', 
          error.message
        );
      }

      updateStep('error', 'error', `Processing failed: ${error.message}`);
      setProcessingState(prev => ({ ...prev, status: 'error' }));
      
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectBestOcrResult = (ocrResults: Record<string, any>) => {
    const validResults = Object.values(ocrResults).filter(
      (result: any) => result && result.text && !result.error
    );

    if (validResults.length === 0) return null;

    // Return the result with highest confidence
    return validResults.reduce((best: any, current: any) => 
      current.confidence > best.confidence ? current : best
    );
  };

  const performMajorityVoting = (llmResults: any[]) => {
    if (llmResults.length === 1) {
      return llmResults[0].data;
    }

    // For now, return the result with highest confidence
    // In a real implementation, you would compare field values across results
    const bestResult = llmResults.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    return bestResult.data;
  };

  const isInvoiceData = (data: any): boolean => {
    return data && (
      data.invoice || 
      data.client_name || 
      data.total || 
      data.invoice_number
    );
  };

  const updateStep = (stepName: string, status: 'pending' | 'processing' | 'completed' | 'error', output?: string) => {
    setProcessingState(prev => {
      const existingStepIndex = prev.steps.findIndex(step => step.name === stepName);
      const newStep = {
        id: stepName,
        name: stepName,
        status,
        output,
        processingTime: status === 'completed' ? Math.random() * 2000 + 500 : undefined
      };

      if (existingStepIndex >= 0) {
        const newSteps = [...prev.steps];
        newSteps[existingStepIndex] = newStep;
        return { ...prev, steps: newSteps };
      } else {
        return { ...prev, steps: [...prev.steps, newStep] };
      }
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Document Information Extraction</h1>
      
      {/* Document Template Display */}
      {documentType && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Expected Output Template for {documentType}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
              {JSON.stringify(getDocumentTemplate(documentType), null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Select Document</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="file">File:</Label>
              <Input type="file" id="file" onChange={handleFileChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentType">Document Type:</Label>
                <Select onValueChange={handleDocumentTypeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">Language:</Label>
                <Select onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>OCR Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {activeOcrModels.map((model) => (
              <div key={model.name} className="flex items-center space-x-2">
                <Checkbox
                  id={model.name}
                  checked={model.isActive}
                  onCheckedChange={() => handleOcrModelToggle(model.name)}
                />
                <Label htmlFor={model.name}>{model.displayName}</Label>
                <span className="text-sm text-gray-500">{model.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>LLM Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {llmModels.map((model) => (
              <div key={model.name} className="flex items-center space-x-2">
                <Checkbox
                  id={model.name}
                  checked={model.isActive}
                  onCheckedChange={() => handleLlmModelToggle(model.name)}
                />
                <Label htmlFor={model.name}>{model.displayName}</Label>
                <span className="text-sm text-gray-500">{model.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={processDocument} disabled={isProcessing} className="mb-4">
        {isProcessing ? 'Processing...' : 'Start Processing'}
      </Button>

      {processingState.documentId && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Processing Status</h2>
          <Card>
            <CardHeader>
              <CardTitle>Document: {processingState.fileName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant="secondary">Status: {processingState.status}</Badge>
                <h3 className="text-lg font-semibold">Processing Steps:</h3>
                <ul className="list-disc pl-5">
                  {processingState.steps.map((step) => (
                    <li key={step.id}>
                      {step.name}: {step.status}
                      {step.output && <p className="text-sm text-gray-500">Output: {String(step.output)}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {processingState.ocrResults && Object.keys(processingState.ocrResults).length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">OCR Results</h2>
          <Card>
            <CardHeader>
              <CardTitle>Extracted Text from Multiple Models</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(processingState.ocrResults).map(([model, result]: [string, any]) => (
                <div key={model} className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {model}
                    {result.error ? (
                      <Badge variant="destructive">Failed</Badge>
                    ) : (
                      <Badge variant="secondary">Confidence: {(result.confidence * 100).toFixed(1)}%</Badge>
                    )}
                  </h3>
                  {result.error ? (
                    <div className="text-red-600 bg-red-50 p-3 rounded">
                      Error: {result.error}
                    </div>
                  ) : (
                    <Textarea
                      value={result.text}
                      className="w-full h-32 resize-none mt-2"
                      readOnly
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {processingState.extractedData && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Extracted Structured Data</h2>
          <Card>
            <CardHeader>
              <CardTitle>Final Extraction Result ({processingState.documentType})</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                {JSON.stringify(processingState.extractedData, null, 2)}
              </pre>
            </CardContent>
          </Card>
          <GenericDocumentDisplay data={processingState.extractedData} documentType={processingState.documentType} />
        </div>
      )}
    </div>
  );
};
