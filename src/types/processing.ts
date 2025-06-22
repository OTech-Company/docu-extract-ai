export interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  output?: unknown;
  error?: string;
  processingTime?: number;
}

export interface OCRModel {
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface OcrResult {
  text: string;
  confidence: number;
  error?: string;
}

export interface DocumentProcessingState {
  documentId?: string;
  fileName: string;
  fileSize: number;
  documentType: string;
  language: string;
  status: 'uploading' | 'preprocessing' | 'ocr' | 'extraction' | 'validation' | 'completed' | 'error';
  steps: ProcessingStep[];
  ocrResults: Record<string, OcrResult>;
  extractedData?: ExtractedInvoiceData;
  validationResults?: ValidationResult;
}

export interface InvoiceDetails {
  invoice_number?: string;
  client_name?: string;
}

export interface ItemDetails {
  [key: string]: unknown; 
}

export interface SubtotalDetails {
  total?: number;
}

export interface ExtractedInvoiceData {
  invoice?: InvoiceDetails;
  items?: ItemDetails[];
  subtotal?: SubtotalDetails;
  [key: string]: unknown;
}
