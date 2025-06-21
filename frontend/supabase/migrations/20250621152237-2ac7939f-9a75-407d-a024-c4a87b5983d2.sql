
-- Create table for storing document processing operations
CREATE TABLE public.document_processing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  document_type TEXT NOT NULL,
  language TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for processing steps
CREATE TABLE public.processing_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.document_processing(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input_data JSONB,
  output_data JSONB,
  processing_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for OCR results
CREATE TABLE public.ocr_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.document_processing(id) ON DELETE CASCADE,
  ocr_model TEXT NOT NULL,
  extracted_text TEXT,
  confidence_score DECIMAL(5,4),
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for extracted invoice data
CREATE TABLE public.extracted_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.document_processing(id) ON DELETE CASCADE,
  client_name TEXT,
  client_address TEXT,
  seller_name TEXT,
  seller_address TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  tax DECIMAL(10,2),
  discount DECIMAL(10,2),
  total DECIMAL(10,2),
  bank_name TEXT,
  account_number TEXT,
  payment_method TEXT,
  validation_status TEXT DEFAULT 'pending',
  validation_errors JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for invoice items
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.extracted_invoices(id) ON DELETE CASCADE,
  description TEXT,
  quantity TEXT,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for processing statistics
CREATE TABLE public.processing_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_documents INTEGER DEFAULT 0,
  successful_extractions INTEGER DEFAULT 0,
  failed_extractions INTEGER DEFAULT 0,
  fine_tuning_threshold INTEGER DEFAULT 500,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial statistics record
INSERT INTO public.processing_statistics (total_documents, successful_extractions, failed_extractions)
VALUES (0, 0, 0);

-- Enable RLS on all tables
ALTER TABLE public.document_processing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_statistics ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (modify as needed for authentication)
CREATE POLICY "Allow all operations" ON public.document_processing FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.processing_steps FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.ocr_results FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.extracted_invoices FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.invoice_items FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.processing_statistics FOR ALL USING (true);
