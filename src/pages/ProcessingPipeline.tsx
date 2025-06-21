
import React, { useState, useCallback } from 'react';
import { FileUpload } from '../components/FileUpload';
import { ProcessingSteps } from '../components/ProcessingSteps';
import { OCRModelSelector } from '../components/OCRModelSelector';
import { JSONValidationDisplay } from '../components/JSONValidationDisplay';
import { Cog, Upload } from 'lucide-react';
import { db } from '../lib/supabase';
import type { DocumentProcessingState, ProcessingStep, OCRModel } from '../types/processing';

const MOCK_OCR_MODELS: OCRModel[] = [
  { name: 'paddle', displayName: 'Paddle OCR', description: 'Fast and accurate OCR for general documents', isActive: true },
  { name: 'tesseract', displayName: 'Tesseract OCR', description: 'Open-source OCR engine with good language support', isActive: true },
  { name: 'easy', displayName: 'Easy OCR', description: 'Simple and efficient OCR for basic text extraction', isActive: true },
  { name: 'doctr', displayName: 'DocTR OCR', description: 'Deep learning-based OCR for complex documents', isActive: true }
];

export const ProcessingPipeline = () => {
  const [processingState, setProcessingState] = useState<DocumentProcessingState | null>(null);
  const [selectedOCRModels, setSelectedOCRModels] = useState<string[]>(['paddle', 'tesseract']);

  const simulateImagePreprocessing = async (file: File): Promise<string> => {
    // Simulate preprocessing
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `Preprocessed image: ${file.name} - Enhanced contrast, removed noise, corrected skew`;
  };

  const simulateOCR = async (model: string, imageData: string): Promise<{ text: string; confidence: number }> => {
    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockTexts = {
      paddle: "INVOICE #INV-2024-001\nDate: 2024-01-15\nBill To: Acme Corp\n123 Business St\nTotal: $1,250.00",
      tesseract: "INVOICE #INV-2024-001\nDate: 2024-01-15\nBill To: Acme Corp\n123 Business St\nTotal: $1,250.00",
      easy: "INVOICE INV-2024-001\nDate 2024-01-15\nBill To Acme Corp\n123 Business St\nTotal 1,250.00",
      doctr: "INVOICE #INV-2024-001\nDate: 2024-01-15\nBill To: Acme Corp\n123 Business Street\nTotal: $1,250.00"
    };

    const confidences = {
      paddle: 0.95,
      tesseract: 0.92,
      easy: 0.88,
      doctr: 0.97
    };

    return {
      text: mockTexts[model as keyof typeof mockTexts] || "Sample extracted text",
      confidence: confidences[model as keyof typeof confidences] || 0.90
    };
  };

  const processWithGemini = async (imageData: string) => {
    // Mock Gemini API response
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      invoice: {
        client_name: "Acme Corp",
        client_address: "123 Business Street, City, State 12345",
        seller_name: "Your Company",
        seller_address: "456 Seller Ave, Business City, BC 67890",
        invoice_number: "INV-2024-001",
        invoice_date: "2024-01-15",
        due_date: "2024-02-15"
      },
      items: [
        {
          description: "Professional Services",
          quantity: "10",
          total_price: "1000.00"
        },
        {
          description: "Additional Fees",
          quantity: "1",
          total_price: "250.00"
        }
      ],
      subtotal: {
        tax: "125.00",
        discount: "0.00",
        total: "1250.00"
      },
      payment_instructions: {
        due_date: "2024-02-15",
        bank_name: "Business Bank",
        account_number: "****1234",
        payment_method: "Bank Transfer"
      }
    };
  };

  const validateJSON = (data: any) => {
    const errors = [];
    
    if (!data.invoice?.invoice_number) errors.push("Missing invoice number");
    if (!data.invoice?.client_name) errors.push("Missing client name");
    if (!data.items || data.items.length === 0) errors.push("No items found");
    if (!data.subtotal?.total) errors.push("Missing total amount");
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const processDocument = useCallback(async (file: File) => {
    const initialState: DocumentProcessingState = {
      fileName: file.name,
      fileSize: file.size,
      documentType: 'invoice',
      language: 'english',
      status: 'uploading',
      steps: [
        { id: '1', name: 'Image Upload', status: 'completed' },
        { id: '2', name: 'Image Preprocessing', status: 'pending' },
        { id: '3', name: 'OCR Processing', status: 'pending' },
        { id: '4', name: 'Data Extraction', status: 'pending' },
        { id: '5', name: 'JSON Validation', status: 'pending' },
        { id: '6', name: 'Database Storage', status: 'pending' }
      ],
      ocrResults: {}
    };

    setProcessingState(initialState);

    try {
      // Save document processing record
      const docResult = await db.saveDocumentProcessing({
        fileName: file.name,
        fileSize: file.size,
        documentType: 'invoice',
        language: 'english'
      });

      if (docResult.success) {
        setProcessingState(prev => ({ ...prev!, documentId: docResult.data.id }));
      }

      // Step 2: Image Preprocessing
      setProcessingState(prev => ({
        ...prev!,
        status: 'preprocessing',
        steps: prev!.steps.map(step => 
          step.id === '2' ? { ...step, status: 'processing' } : step
        )
      }));

      const startTime = Date.now();
      const preprocessedResult = await simulateImagePreprocessing(file);
      const preprocessingTime = Date.now() - startTime;

      setProcessingState(prev => ({
        ...prev!,
        steps: prev!.steps.map(step => 
          step.id === '2' ? { 
            ...step, 
            status: 'completed', 
            output: preprocessedResult,
            processingTime: preprocessingTime
          } : step
        )
      }));

      // Save preprocessing step
      if (docResult.success) {
        await db.saveProcessingStep({
          documentId: docResult.data.id,
          stepName: 'Image Preprocessing',
          stepOrder: 2,
          status: 'completed',
          outputData: { result: preprocessedResult },
          processingTimeMs: preprocessingTime
        });
      }

      // Step 3: OCR Processing
      setProcessingState(prev => ({
        ...prev!,
        status: 'ocr',
        steps: prev!.steps.map(step => 
          step.id === '3' ? { ...step, status: 'processing' } : step
        )
      }));

      const ocrResults: Record<string, any> = {};
      
      for (const model of selectedOCRModels) {
        const ocrStartTime = Date.now();
        const result = await simulateOCR(model, preprocessedResult);
        const ocrProcessingTime = Date.now() - ocrStartTime;
        
        ocrResults[model] = { ...result, processingTime: ocrProcessingTime };

        // Save OCR result
        if (docResult.success) {
          await db.saveOCRResult({
            documentId: docResult.data.id,
            ocrModel: model,
            extractedText: result.text,
            confidenceScore: result.confidence,
            processingTimeMs: ocrProcessingTime
          });
        }
      }

      setProcessingState(prev => ({
        ...prev!,
        ocrResults,
        steps: prev!.steps.map(step => 
          step.id === '3' ? { 
            ...step, 
            status: 'completed',
            output: ocrResults
          } : step
        )
      }));

      // Step 4: Data Extraction with Gemini
      setProcessingState(prev => ({
        ...prev!,
        status: 'extraction',
        steps: prev!.steps.map(step => 
          step.id === '4' ? { ...step, status: 'processing' } : step
        )
      }));

      const extractionStartTime = Date.now();
      const extractedData = await processWithGemini(preprocessedResult);
      const extractionTime = Date.now() - extractionStartTime;

      setProcessingState(prev => ({
        ...prev!,
        extractedData,
        steps: prev!.steps.map(step => 
          step.id === '4' ? { 
            ...step, 
            status: 'completed',
            output: extractedData,
            processingTime: extractionTime
          } : step
        )
      }));

      // Step 5: JSON Validation
      setProcessingState(prev => ({
        ...prev!,
        status: 'validation',
        steps: prev!.steps.map(step => 
          step.id === '5' ? { ...step, status: 'processing' } : step
        )
      }));

      const validationResult = validateJSON(extractedData);

      setProcessingState(prev => ({
        ...prev!,
        validationResults: validationResult,
        steps: prev!.steps.map(step => 
          step.id === '5' ? { 
            ...step, 
            status: validationResult.isValid ? 'completed' : 'error',
            output: validationResult
          } : step
        )
      }));

      // Step 6: Database Storage
      if (validationResult.isValid && docResult.success) {
        setProcessingState(prev => ({
          ...prev!,
          steps: prev!.steps.map(step => 
            step.id === '6' ? { ...step, status: 'processing' } : step
          )
        }));

        const saveResult = await db.saveExtractedInvoice({
          documentId: docResult.data.id,
          ...extractedData
        });

        setProcessingState(prev => ({
          ...prev!,
          status: 'completed',
          steps: prev!.steps.map(step => 
            step.id === '6' ? { 
              ...step, 
              status: saveResult.success ? 'completed' : 'error',
              output: saveResult.success ? 'Data saved successfully' : 'Failed to save data'
            } : step
          )
        }));

        if (saveResult.success) {
          await db.updateStatistics();
        }
      }

    } catch (error) {
      console.error('Processing error:', error);
      setProcessingState(prev => ({
        ...prev!,
        status: 'error',
        steps: prev!.steps.map(step => 
          step.status === 'processing' ? { ...step, status: 'error', error: 'Processing failed' } : step
        )
      }));
    }
  }, [selectedOCRModels]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Cog className="w-12 h-12 text-blue-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">Processing Pipeline</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Follow the complete document processing workflow with detailed step outputs
        </p>
      </div>

      {!processingState ? (
        <div className="space-y-6">
          <OCRModelSelector 
            models={MOCK_OCR_MODELS}
            selectedModels={selectedOCRModels}
            onSelectionChange={setSelectedOCRModels}
          />
          <FileUpload 
            onFileSelect={processDocument} 
            isLoading={false}
          />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Document: {processingState.fileName}</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Size:</span> {(processingState.fileSize / 1024).toFixed(1)} KB
              </div>
              <div>
                <span className="font-medium">Type:</span> {processingState.documentType}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  processingState.status === 'completed' ? 'bg-green-100 text-green-800' :
                  processingState.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {processingState.status}
                </span>
              </div>
            </div>
          </div>

          <ProcessingSteps steps={processingState.steps} />

          {processingState.extractedData && (
            <JSONValidationDisplay 
              data={processingState.extractedData}
              validationResult={processingState.validationResults}
            />
          )}

          <button
            onClick={() => setProcessingState(null)}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Process Another Document
          </button>
        </div>
      )}
    </div>
  );
};
