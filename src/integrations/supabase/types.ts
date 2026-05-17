export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      electives: {
        Row: {
          category: string
          code: string
          created_at: string
          id: string
          name: string
          remaining_seats: number
          total_seats: number
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          id?: string
          name: string
          remaining_seats?: number
          total_seats?: number
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          remaining_seats?: number
          total_seats?: number
        }
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          pe4_elective_id: string | null
          pe4_replacement: string | null
          pe5_elective_id: string | null
          pe5_replacement: string | null
          pe6_elective_id: string | null
          pe6_replacement: string | null
          register_number: string
          section: string
          student_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          pe4_elective_id?: string | null
          pe4_replacement?: string | null
          pe5_elective_id?: string | null
          pe5_replacement?: string | null
          pe6_elective_id?: string | null
          pe6_replacement?: string | null
          register_number: string
          section: string
          student_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          pe4_elective_id?: string | null
          pe4_replacement?: string | null
          pe5_elective_id?: string | null
          pe5_replacement?: string | null
          pe6_elective_id?: string | null
          pe6_replacement?: string | null
          register_number?: string
          section?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_pe4_elective_id_fkey"
            columns: ["pe4_elective_id"]
            isOneToOne: false
            referencedRelation: "electives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_pe5_elective_id_fkey"
            columns: ["pe5_elective_id"]
            isOneToOne: false
            referencedRelation: "electives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_pe6_elective_id_fkey"
            columns: ["pe6_elective_id"]
            isOneToOne: false
            referencedRelation: "electives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          elective_id: string
          expires_at: string
          id: string
          register_number: string
        }
        Insert: {
          created_at?: string
          elective_id: string
          expires_at: string
          id?: string
          register_number: string
        }
        Update: {
          created_at?: string
          elective_id?: string
          expires_at?: string
          id?: string
          register_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_elective_id_fkey"
            columns: ["elective_id"]
            isOneToOne: false
            referencedRelation: "electives"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          register_number: string
          section: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          register_number: string
          section?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          register_number?: string
          section?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      active_reservations_count: {
        Args: { p_elective_id: string; p_exclude_reg?: string }
        Returns: number
      }
      expire_reservations: { Args: never; Returns: undefined }
      register_student_atomic: {
        Args: {
          p_email: string
          p_name: string
          p_pe4_id: string
          p_pe4_repl: string
          p_pe5_id: string
          p_pe5_repl: string
          p_pe6_id: string
          p_pe6_repl: string
          p_register_number: string
          p_section: string
        }
        Returns: Json
      }
      release_seat: {
        Args: { p_elective_id: string; p_register_number: string }
        Returns: undefined
      }
      reserve_seat: {
        Args: { p_elective_id: string; p_register_number: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
