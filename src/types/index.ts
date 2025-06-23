
export interface InvoiceData {
  invoice: {
    client_name: string;
    client_address: string;
    seller_name: string;
    seller_address: string;
    invoice_number: string;
    invoice_date: string | null;
    due_date: string | null;
  };
  items: Array<{
    description: string;
    quantity: string;
    total_price: string;
  }>;
  subtotal: {
    tax: string;
    discount: string;
    total: string;
  };
  payment_instructions: {
    due_date: string | null;
    bank_name: string;
    account_number: string;
    payment_method: string;
  };
}

export interface GenericDocumentData {
  [key: string]: any;
}

export interface ProcessedInvoice {
  id: string;
  document_id: string;
  client_name: string | null;
  client_address: string | null;
  seller_name: string | null;
  seller_address: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  tax: number | null;
  discount: number | null;
  total: number | null;
  bank_name: string | null;
  account_number: string | null;
  payment_method: string | null;
  validation_status: string | null;
  created_at: string;
  timestamp?: number;
  invoice_items: Array<{
    id: string;
    invoice_id: string;
    description: string | null;
    quantity: string | null;
    unit_price: number | null;
    total_price: number | null;
  }>;
}

export interface ProcessingStatistics {
  total_documents: number;
  fine_tuning_threshold: number;
  progress_percentage: number;
  records_remaining: number;
  fine_tuning_ready: boolean;
}
