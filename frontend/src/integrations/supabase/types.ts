export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      document_processing: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_size: number | null
          id: string
          language: string
          processing_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_size?: number | null
          id?: string
          language: string
          processing_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_size?: number | null
          id?: string
          language?: string
          processing_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      extracted_invoices: {
        Row: {
          account_number: string | null
          bank_name: string | null
          client_address: string | null
          client_name: string | null
          created_at: string
          discount: number | null
          document_id: string | null
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          payment_method: string | null
          seller_address: string | null
          seller_name: string | null
          tax: number | null
          total: number | null
          validation_errors: Json | null
          validation_status: string | null
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          client_address?: string | null
          client_name?: string | null
          created_at?: string
          discount?: number | null
          document_id?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          payment_method?: string | null
          seller_address?: string | null
          seller_name?: string | null
          tax?: number | null
          total?: number | null
          validation_errors?: Json | null
          validation_status?: string | null
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          client_address?: string | null
          client_name?: string | null
          created_at?: string
          discount?: number | null
          document_id?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          payment_method?: string | null
          seller_address?: string | null
          seller_name?: string | null
          tax?: number | null
          total?: number | null
          validation_errors?: Json | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extracted_invoices_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_processing"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invoice_id: string | null
          quantity: string | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          quantity?: string | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          quantity?: string | null
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "extracted_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_results: {
        Row: {
          confidence_score: number | null
          created_at: string
          document_id: string | null
          extracted_text: string | null
          id: string
          ocr_model: string
          processing_time_ms: number | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          document_id?: string | null
          extracted_text?: string | null
          id?: string
          ocr_model: string
          processing_time_ms?: number | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          document_id?: string | null
          extracted_text?: string | null
          id?: string
          ocr_model?: string
          processing_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ocr_results_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_processing"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_statistics: {
        Row: {
          failed_extractions: number | null
          fine_tuning_threshold: number | null
          id: string
          last_updated: string
          successful_extractions: number | null
          total_documents: number | null
        }
        Insert: {
          failed_extractions?: number | null
          fine_tuning_threshold?: number | null
          id?: string
          last_updated?: string
          successful_extractions?: number | null
          total_documents?: number | null
        }
        Update: {
          failed_extractions?: number | null
          fine_tuning_threshold?: number | null
          id?: string
          last_updated?: string
          successful_extractions?: number | null
          total_documents?: number | null
        }
        Relationships: []
      }
      processing_steps: {
        Row: {
          created_at: string
          document_id: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          processing_time_ms: number | null
          status: string
          step_name: string
          step_order: number
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          processing_time_ms?: number | null
          status?: string
          step_name: string
          step_order: number
        }
        Update: {
          created_at?: string
          document_id?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          processing_time_ms?: number | null
          status?: string
          step_name?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "processing_steps_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_processing"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
