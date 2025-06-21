
import { supabase } from '@/integrations/supabase/client';

export class DatabaseService {
  async saveDocumentProcessing(data: {
    fileName: string;
    fileSize: number;
    documentType: string;
    language: string;
  }) {
    try {
      const { data: result, error } = await supabase
        .from('document_processing')
        .insert({
          file_name: data.fileName,
          file_size: data.fileSize,
          document_type: data.documentType,
          language: data.language,
          processing_status: 'processing'
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      console.error('Error saving document processing:', error);
      return { success: false, error };
    }
  }

  async saveProcessingStep(data: {
    documentId: string;
    stepName: string;
    stepOrder: number;
    status: string;
    inputData?: any;
    outputData?: any;
    processingTimeMs?: number;
    errorMessage?: string;
  }) {
    try {
      const { data: result, error } = await supabase
        .from('processing_steps')
        .insert({
          document_id: data.documentId,
          step_name: data.stepName,
          step_order: data.stepOrder,
          status: data.status,
          input_data: data.inputData,
          output_data: data.outputData,
          processing_time_ms: data.processingTimeMs,
          error_message: data.errorMessage
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      console.error('Error saving processing step:', error);
      return { success: false, error };
    }
  }

  async saveOCRResult(data: {
    documentId: string;
    ocrModel: string;
    extractedText: string;
    confidenceScore: number;
    processingTimeMs: number;
  }) {
    try {
      const { data: result, error } = await supabase
        .from('ocr_results')
        .insert({
          document_id: data.documentId,
          ocr_model: data.ocrModel,
          extracted_text: data.extractedText,
          confidence_score: data.confidenceScore,
          processing_time_ms: data.processingTimeMs
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      console.error('Error saving OCR result:', error);
      return { success: false, error };
    }
  }

  async saveExtractedInvoice(data: any) {
    try {
      const { data: result, error } = await supabase
        .from('extracted_invoices')
        .insert({
          document_id: data.documentId,
          client_name: data.invoice.client_name,
          client_address: data.invoice.client_address,
          seller_name: data.invoice.seller_name,
          seller_address: data.invoice.seller_address,
          invoice_number: data.invoice.invoice_number,
          invoice_date: data.invoice.invoice_date,
          due_date: data.invoice.due_date,
          tax: parseFloat(data.subtotal.tax) || 0,
          discount: parseFloat(data.subtotal.discount) || 0,
          total: parseFloat(data.subtotal.total) || 0,
          bank_name: data.payment_instructions.bank_name,
          account_number: data.payment_instructions.account_number,
          payment_method: data.payment_instructions.payment_method,
          validation_status: 'validated'
        })
        .select()
        .single();

      if (error) throw error;

      // Save invoice items
      if (data.items && data.items.length > 0) {
        const items = data.items.map((item: any) => ({
          invoice_id: result.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: 0,
          total_price: parseFloat(item.total_price) || 0
        }));

        await supabase.from('invoice_items').insert(items);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error saving extracted invoice:', error);
      return { success: false, error };
    }
  }

  async getProcessingStatistics() {
    try {
      const { data, error } = await supabase
        .from('processing_statistics')
        .select('*')
        .single();

      if (error) throw error;

      const progressPercentage = Math.round((data.total_documents / data.fine_tuning_threshold) * 100);
      const recordsRemaining = Math.max(0, data.fine_tuning_threshold - data.total_documents);

      return {
        success: true,
        data: {
          ...data,
          progress_percentage: progressPercentage,
          records_remaining: recordsRemaining,
          fine_tuning_ready: data.total_documents >= data.fine_tuning_threshold
        }
      };
    } catch (error) {
      console.error('Error getting processing statistics:', error);
      return { success: false, error };
    }
  }

  async updateStatistics() {
    try {
      const { data: totalDocs } = await supabase
        .from('document_processing')
        .select('id', { count: 'exact' });

      const { data: successfulDocs } = await supabase
        .from('extracted_invoices')
        .select('id', { count: 'exact' });

      await supabase
        .from('processing_statistics')
        .update({
          total_documents: totalDocs?.length || 0,
          successful_extractions: successfulDocs?.length || 0,
          last_updated: new Date().toISOString()
        })
        .eq('id', (await supabase.from('processing_statistics').select('id').single()).data?.id);

      return { success: true };
    } catch (error) {
      console.error('Error updating statistics:', error);
      return { success: false, error };
    }
  }

  async getRecentInvoices(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('extracted_invoices')
        .select(`
          *,
          invoice_items (*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting recent invoices:', error);
      return { success: false, error };
    }
  }
}

export const db = new DatabaseService();
