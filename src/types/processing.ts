
export interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  output?: any;
  error?: string;
  processingTime?: number;
}

export interface OCRModel {
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
}

export interface DocumentProcessingState {
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
