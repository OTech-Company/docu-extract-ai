import React, { useState, useCallback } from 'react';
import { FileUpload } from '../components/FileUpload';
import { ProcessingSteps } from '../components/ProcessingSteps';
import { OCRModelSelector } from '../components/OCRModelSelector';
import { LLMSelector } from '../components/LLMSelector';
import { JSONValidationDisplay } from '../components/JSONValidationDisplay';
import { Cog, Upload } from 'lucide-react';
import { db } from '../lib/supabase';
import { callGeminiAPI, callGroqAPI, callQwenAPI, applyMajorityVoting, type LLMResponse } from '../lib/llmServices';
import type { DocumentProcessingState, ProcessingStep, OCRModel, ExtractedInvoiceData, InvoiceDetails, ItemDetails, SubtotalDetails } from '../types/processing';

const MOCK_OCR_MODELS: OCRModel[] = [
  { name: 'paddle', displayName: 'Paddle OCR', description: 'Fast and accurate OCR for general documents', isActive: true },
  { name: 'tesseract', displayName: 'Tesseract OCR', description: 'Open-source OCR engine with good language support', isActive: true },
  { name: 'easy', displayName: 'Easy OCR', description: 'Simple and efficient OCR for basic text extraction', isActive: true },
  { name: 'doctr', displayName: 'DocTR OCR', description: 'Deep learning-based OCR for complex documents', isActive: true }
];

// Define types for OCR results and validation
interface OcrResult {
  text: string;
  confidence: number;
  error?: string;
}
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const ProcessingPipeline = () => {
  const [processingState, setProcessingState] = useState<DocumentProcessingState | null>(null);
  const [selectedOCRModels, setSelectedOCRModels] = useState<string[]>(['paddle', 'tesseract']);
  const [llmMode, setLLMMode] = useState<'single' | 'majority'>('single');

  const validateJSON = (data: ExtractedInvoiceData | null): ValidationResult => {
    const errors: string[] = [];
    
    if (!data) {
      errors.push("No data extracted from LLM");
      return { isValid: false, errors };
    }
    
    // Basic structure validation - only require invoice section to exist
    if (!data.invoice || typeof data.invoice !== 'object') {
      errors.push("Missing invoice section");
    } else {
      // Make individual invoice fields optional but warn if completely empty
      const invoiceFields = Object.values(data.invoice).filter(val => val && val !== '');
      if (invoiceFields.length === 0) {
        errors.push("Invoice section is completely empty");
      }
    }
    
    // Make items optional but warn if missing
    if (!data.items || !Array.isArray(data.items)) {
      console.warn("No items array found in extracted data");
    } else if (data.items.length === 0) {
      console.warn("Items array is empty");
    }
    
    // Make subtotal optional but warn if missing
    if (!data.subtotal || typeof data.subtotal !== 'object') {
      console.warn("No subtotal section found in extracted data");
    } else {
      // Only require total if subtotal section exists
      if (!data.subtotal.total) {
        console.warn("No total amount found in subtotal section");
      }
    }
    
    // Make payment_instructions completely optional
    if (!data.payment_instructions) {
      console.warn("No payment instructions found in extracted data");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Helper to call the Flask OCR API
  async function callOcrApi(base64Image: string, model: string) {
    try {
      const response = await fetch('http://localhost:5000/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, model })
      });
      if (!response.ok) throw new Error(`OCR API error for ${model}: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`OCR API call failed for ${model}:`, error);
      throw error;
    }
  }

  const processDocument = useCallback(async (file: File) => {
    console.log('Starting document processing for:', file.name);
    
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
        { id: '4', name: `${llmMode === 'single' ? 'Single LLM' : '3-LLM Majority Voting'} Data Extraction`, status: 'pending' },
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
      const preprocessingTime = 1000;

      setProcessingState(prev => ({
        ...prev!,
        steps: prev!.steps.map(step => 
          step.id === '2' ? { 
            ...step, 
            status: 'completed', 
            output: 'Image preprocessed',
            processingTime: preprocessingTime
          } : step
        )
      }));

      if (docResult.success) {
        await db.saveProcessingStep({
          documentId: docResult.data.id,
          stepName: 'Image Preprocessing',
          stepOrder: 2,
          status: 'completed',
          outputData: { result: 'Image preprocessed' },
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

      const ocrResults: Record<string, OcrResult> = {};
      for (const model of selectedOCRModels) {
        try {
          ocrResults[model] = await callOcrApi(base64Image, model);
        } catch (err) {
          console.error(`OCR failed for model ${model}:`, err);
          ocrResults[model] = { text: '', confidence: 0, error: String(err) };
        }
      }

      setProcessingState(prev => ({
        ...prev!,
        ocrResults,
        steps: prev!.steps.map(step => 
          step.id === '3' ? { ...step, status: 'completed', output: ocrResults } : step
        )
      }));

      // Step 4: LLM Data Extraction
      setProcessingState(prev => ({
        ...prev!,
        status: 'extraction',
        steps: prev!.steps.map(step => 
          step.id === '4' ? { ...step, status: 'processing' } : step
        )
      }));

      const extractionStartTime = Date.now();
      let extractedData: ExtractedInvoiceData | null = null;
      let llmOutputs: Record<string, LLMResponse> = {};

      // Get best OCR result
      const validOcrResults = Object.values(ocrResults).filter(r => r.text && !r.error);
      if (validOcrResults.length === 0) {
        throw new Error('No valid OCR results available for LLM processing');
      }
      
      const bestOcrResult = validOcrResults.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );

      console.log('Using OCR text for LLM:', bestOcrResult.text.substring(0, 200) + '...');

      if (llmMode === 'single') {
        // Single LLM mode
        const geminiResponse = await callGeminiAPI(bestOcrResult.text);
        extractedData = geminiResponse.json as ExtractedInvoiceData;
        llmOutputs = { gemini: geminiResponse };
        
        if (geminiResponse.error) {
          console.error('Gemini API failed:', geminiResponse.error);
        }
      } else {
        // Majority voting mode - use all 3 LLMs
        console.log('Starting majority voting with 3 LLMs');
        
        const [geminiResponse, groqResponse, qwenResponse] = await Promise.all([
          callGeminiAPI(bestOcrResult.text),
          callGroqAPI(bestOcrResult.text),
          callQwenAPI(bestOcrResult.text)
        ]);

        llmOutputs = {
          gemini: geminiResponse,
          groq: groqResponse,
          qwen: qwenResponse
        };

        // Apply majority voting with Mistral - always pass all 3 responses
        try {
          extractedData = await applyMajorityVoting([geminiResponse, groqResponse, qwenResponse]);
        } catch (error) {
          console.error('Majority voting failed:', error);
          // Fallback to first successful response
          const validResponses = [geminiResponse, groqResponse, qwenResponse].filter(r => r.json && !r.error);
          if (validResponses.length > 0) {
            extractedData = validResponses[0].json as ExtractedInvoiceData;
          } else {
            extractedData = null;
          }
        }
      }

      const extractionTime = Date.now() - extractionStartTime;

      setProcessingState(prev => ({
        ...prev!,
        extractedData,
        steps: prev!.steps.map(step => 
          step.id === '4' ? { 
            ...step, 
            status: extractedData ? 'completed' : 'error',
            output: { finalResult: extractedData, llmOutputs },
            processingTime: extractionTime,
            error: extractedData ? undefined : 'Failed to extract data from LLMs'
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
      if (validationResult.isValid && extractedData && docResult.success) {
        setProcessingState(prev => ({
          ...prev!,
          steps: prev!.steps.map(step => 
            step.id === '6' ? { ...step, status: 'processing' } : step
          )
        }));

        try {
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
        } catch (error) {
          console.error('Database storage failed:', error);
          setProcessingState(prev => ({
            ...prev!,
            status: 'error',
            steps: prev!.steps.map(step => 
              step.id === '6' ? { 
                ...step, 
                status: 'error',
                error: 'Database storage failed'
              } : step
            )
          }));
        }
      } else {
        setProcessingState(prev => ({
          ...prev!,
          status: validationResult.isValid ? 'completed' : 'error'
        }));
      }

    } catch (error) {
      console.error('Processing error:', error);
      setProcessingState(prev => ({
        ...prev!,
        status: 'error',
        steps: prev!.steps.map(step => 
          step.status === 'processing' ? { 
            ...step, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Processing failed'
          } : step
        )
      }));
    }
  }, [selectedOCRModels, llmMode]);

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
          <LLMSelector 
            selectedMode={llmMode}
            onModeChange={setLLMMode}
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
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Size:</span> {(processingState.fileSize / 1024).toFixed(1)} KB
              </div>
              <div>
                <span className="font-medium">Type:</span> {processingState.documentType}
              </div>
              <div>
                <span className="font-medium">LLM Mode:</span> {llmMode === 'single' ? 'Single LLM' : 'Majority Voting'}
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
