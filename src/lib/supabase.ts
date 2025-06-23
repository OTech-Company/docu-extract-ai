import { supabase } from '@/integrations/supabase/client';

export class DatabaseService {
  // ... existing methods ...

  async getAllDocuments(limit = 100) {
    try {
      const { data, error } = await supabase
        .from('document_processing')
        .select(`
          *,
          processing_steps (*),
          ocr_results (*),
          extracted_invoices (*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting all documents:', error);
      return { success: false, error };
    }
  }

  async getDocumentsByType(documentType: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('document_processing')
        .select(`
          *,
          processing_steps (*),
          ocr_results (*),
          extracted_invoices (*)
        `)
        .eq('document_type', documentType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting documents by type:', error);
      return { success: false, error };
    }
  }

  async getProcessingStepsAnalytics(limit = 1000) {
    try {
      const { data, error } = await supabase
        .from('processing_steps')
        .select(`
          *,
          document_processing!inner (
            document_type,
            language,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting processing steps analytics:', error);
      return { success: false, error };
    }
  }

  async getDocumentTypeDistribution() {
    try {
      const { data, error } = await supabase
        .from('document_processing')
        .select('document_type, processing_status')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting document type distribution:', error);
      return { success: false, error };
    }
  }

  async getLanguageDistribution() {
    try {
      const { data, error } = await supabase
        .from('document_processing')
        .select('language, processing_status')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting language distribution:', error);
      return { success: false, error };
    }
  }

  async getProcessingPerformanceStats() {
    try {
      const { data, error } = await supabase
        .from('processing_steps')
        .select(`
          step_name,
          processing_time_ms,
          status,
          created_at,
          document_processing!inner (document_type)
        `)
        .not('processing_time_ms', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting processing performance stats:', error);
      return { success: false, error };
    }
  }

  // ... rest of existing methods unchanged ...
  async saveDocumentProcessing(data: {
    fileName: string;
    fileSize: number;
    documentType: string;
    language: string;
  }) {
    try {
      // Check for duplicates first
      const { data: existingDoc } = await supabase
        .from('document_processing')
        .select('id')
        .eq('file_name', data.fileName)
        .eq('file_size', data.fileSize)
        .eq('document_type', data.documentType)
        .eq('language', data.language)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .maybeSingle();

      if (existingDoc) {
        console.log('Duplicate document detected, updating existing record');
        const { data: result, error } = await supabase
          .from('document_processing')
          .update({
            processing_status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDoc.id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data: result };
      }

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

  async updateDocumentWithOCR(documentId: string, ocrText: string, confidence: number) {
    try {
      const { data: result, error } = await supabase
        .from('document_processing')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating document with OCR:', error);
      return { success: false, error };
    }
  }

  async updateDocumentStatus(documentId: string, status: string, finalStatus?: string, errorDetails?: string) {
    try {
      const updateData: any = {
        processing_status: status,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('document_processing')
        .update(updateData)
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating document status:', error);
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
    attemptNumber?: number;
    modelUsed?: string;
    confidenceScore?: number;
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

      // Also update the main document with OCR text
      await this.updateDocumentWithOCR(data.documentId, data.extractedText, data.confidenceScore);

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
          client_name: data.invoice?.client_name,
          client_address: data.invoice?.client_address,
          seller_name: data.invoice?.seller_name,
          seller_address: data.invoice?.seller_address,
          invoice_number: data.invoice?.invoice_number,
          invoice_date: data.invoice?.invoice_date,
          due_date: data.invoice?.due_date,
          tax: parseFloat(data.subtotal?.tax) || 0,
          discount: parseFloat(data.subtotal?.discount) || 0,
          total: parseFloat(data.subtotal?.total) || 0,
          bank_name: data.payment_instructions?.bank_name,
          account_number: data.payment_instructions?.account_number,
          payment_method: data.payment_instructions?.payment_method,
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

      // Update document status to completed
      await this.updateDocumentStatus(data.documentId, 'completed', 'success');

      return { success: true, data: result };
    } catch (error) {
      console.error('Error saving extracted invoice:', error);
      
      // Update document status to failed
      await this.updateDocumentStatus(data.documentId, 'failed', 'failed', (error as any).message);
      
      return { success: false, error };
    }
  }

  async getComprehensiveAnalytics() {
    try {
      // Get all processing data
      const { data: processingData, error: processingError } = await supabase
        .from('document_processing')
        .select(`
          *,
          processing_steps (*),
          ocr_results (*),
          extracted_invoices (
            *,
            invoice_items (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (processingError) throw processingError;

      // Calculate comprehensive statistics
      const totalDocuments = processingData?.length || 0;
      const successfulExtractions = processingData?.filter(doc => 
        doc.extracted_invoices && doc.extracted_invoices.length > 0
      ).length || 0;
      const failedExtractions = processingData?.filter(doc => 
        doc.processing_status === 'failed'
      ).length || 0;
      const inProgressExtractions = processingData?.filter(doc => 
        doc.processing_status === 'processing'
      ).length || 0;

      // Calculate average confidence scores
      const ocrResults = processingData?.flatMap(doc => doc.ocr_results || []) || [];
      const avgConfidence = ocrResults.length > 0 
        ? ocrResults.reduce((sum, ocr) => sum + (ocr.confidence_score || 0), 0) / ocrResults.length
        : 0;

      // Calculate processing attempts statistics - use default of 1 since field may not exist
      const totalAttempts = processingData?.reduce((sum, doc) => sum + 1, 0) || 0;
      const avgProcessingTime = processingData?.length > 0 
        ? processingData.reduce((sum, doc) => {
            const steps = doc.processing_steps || [];
            const totalTime = steps.reduce((stepSum, step) => stepSum + (step.processing_time_ms || 0), 0);
            return sum + totalTime;
          }, 0) / processingData.length
        : 0;

      // Document type distribution
      const documentTypes = processingData?.reduce((acc, doc) => {
        acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Language distribution
      const languages = processingData?.reduce((acc, doc) => {
        acc[doc.language] = (acc[doc.language] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        success: true,
        data: {
          overview: {
            total_documents: totalDocuments,
            successful_extractions: successfulExtractions,
            failed_extractions: failedExtractions,
            in_progress_extractions: inProgressExtractions,
            success_rate: totalDocuments > 0 ? Math.round((successfulExtractions / totalDocuments) * 100) : 0,
            avg_confidence_score: Math.round(avgConfidence * 10000) / 100, // Convert to percentage
            total_processing_attempts: totalAttempts,
            avg_processing_time_ms: Math.round(avgProcessingTime),
            fine_tuning_threshold: 500,
            progress_percentage: Math.min(100, Math.round((totalDocuments / 500) * 100)),
            records_remaining: Math.max(0, 500 - totalDocuments),
            fine_tuning_ready: totalDocuments >= 500
          },
          document_types: documentTypes,
          languages: languages,
          recent_documents: processingData?.slice(0, 20) || [],
          all_documents: processingData || []
        }
      };
    } catch (error) {
      console.error('Error getting comprehensive analytics:', error);
      return { success: false, error };
    }
  }

  async getProcessingStatistics() {
    const analyticsResult = await this.getComprehensiveAnalytics();
    if (analyticsResult.success) {
      return { success: true, data: analyticsResult.data.overview };
    }
    return analyticsResult;
  }

  async updateStatistics() {
    try {
      const analyticsResult = await this.getComprehensiveAnalytics();
      if (!analyticsResult.success) {
        throw new Error('Failed to get analytics data');
      }

      const overview = analyticsResult.data.overview;

      // Get existing statistics record
      const { data: existingStats } = await supabase
        .from('processing_statistics')
        .select('id')
        .limit(1)
        .maybeSingle();

      const updateData = {
        total_documents: overview.total_documents,
        successful_extractions: overview.successful_extractions,
        failed_extractions: overview.failed_extractions,
        last_updated: new Date().toISOString()
      };

      if (existingStats) {
        await supabase
          .from('processing_statistics')
          .update(updateData)
          .eq('id', existingStats.id);
      } else {
        await supabase
          .from('processing_statistics')
          .insert(updateData);
      }

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
          invoice_items (*),
          document_processing!inner (
            file_name,
            document_type,
            language,
            processing_status
          )
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

  async getAllDocuments(limit = 100) {
    try {
      const { data, error } = await supabase
        .from('document_processing')
        .select(`
          *,
          processing_steps (*),
          ocr_results (*),
          extracted_invoices (
            *,
            invoice_items (*)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting all documents:', error);
      return { success: false, error };
    }
  }
}

export const db = new DatabaseService();