
export interface InvoiceData {
  invoice: {
    client_name: string;
    client_address: string;
    seller_name: string;
    seller_address: string;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
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
    due_date: string;
    bank_name: string;
    account_number: string;
    payment_method: string;
  };
}

export interface ProcessedInvoice extends InvoiceData {
  id: string;
  timestamp: number;
}
