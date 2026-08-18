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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      configuracion: {
        Row: {
          actualizado_en: string
          clave: string
          descripcion: string | null
          valor: Json
        }
        Insert: {
          actualizado_en?: string
          clave: string
          descripcion?: string | null
          valor: Json
        }
        Update: {
          actualizado_en?: string
          clave?: string
          descripcion?: string | null
          valor?: Json
        }
        Relationships: []
      }
      diagnostico: {
        Row: {
          creado_en: string
          creado_por: string
          datos: Json
          derivados: Json
          estados_bloque: Json
          fecha: string
          fugas: Json
          id: string
          modo: string
          notas: Json
          oportunidad_id: string
          oportunidad_total: number
          origen_diagnostico_id: string | null
          propuesta: Json | null
          version: number
        }
        Insert: {
          creado_en?: string
          creado_por: string
          datos?: Json
          derivados?: Json
          estados_bloque?: Json
          fecha?: string
          fugas?: Json
          id?: string
          modo?: string
          notas?: Json
          oportunidad_id: string
          oportunidad_total?: number
          origen_diagnostico_id?: string | null
          propuesta?: Json | null
          version?: number
        }
        Update: {
          creado_en?: string
          creado_por?: string
          datos?: Json
          derivados?: Json
          estados_bloque?: Json
          fecha?: string
          fugas?: Json
          id?: string
          modo?: string
          notas?: Json
          oportunidad_id?: string
          oportunidad_total?: number
          origen_diagnostico_id?: string | null
          propuesta?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "diagnostico_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "oportunidad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostico_origen_diagnostico_id_fkey"
            columns: ["origen_diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnostico"
            referencedColumns: ["id"]
          },
        ]
      }
      oportunidad: {
        Row: {
          actualizado_en: string
          contacto_email: string | null
          contacto_nombre: string | null
          contacto_telefono: string | null
          creado_en: string
          creado_por: string
          estado: Database["public"]["Enums"]["estado_oportunidad_enum"]
          id: string
          monto_cerrado: number | null
          monto_propuesto: number | null
          motivo_perdida:
            | Database["public"]["Enums"]["motivo_perdida_enum"]
            | null
          nombre_tienda: string
          origen_lead: string | null
          plan_plataforma: string | null
          plataforma: Database["public"]["Enums"]["plataforma_enum"] | null
          servicios_contratados: string[]
          vertical: Database["public"]["Enums"]["vertical_enum"] | null
        }
        Insert: {
          actualizado_en?: string
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          creado_en?: string
          creado_por: string
          estado?: Database["public"]["Enums"]["estado_oportunidad_enum"]
          id?: string
          monto_cerrado?: number | null
          monto_propuesto?: number | null
          motivo_perdida?:
            | Database["public"]["Enums"]["motivo_perdida_enum"]
            | null
          nombre_tienda: string
          origen_lead?: string | null
          plan_plataforma?: string | null
          plataforma?: Database["public"]["Enums"]["plataforma_enum"] | null
          servicios_contratados?: string[]
          vertical?: Database["public"]["Enums"]["vertical_enum"] | null
        }
        Update: {
          actualizado_en?: string
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          creado_en?: string
          creado_por?: string
          estado?: Database["public"]["Enums"]["estado_oportunidad_enum"]
          id?: string
          monto_cerrado?: number | null
          monto_propuesto?: number | null
          motivo_perdida?:
            | Database["public"]["Enums"]["motivo_perdida_enum"]
            | null
          nombre_tienda?: string
          origen_lead?: string | null
          plan_plataforma?: string | null
          plataforma?: Database["public"]["Enums"]["plataforma_enum"] | null
          servicios_contratados?: string[]
          vertical?: Database["public"]["Enums"]["vertical_enum"] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      estado_oportunidad_enum:
        | "en_curso"
        | "propuesta_enviada"
        | "cerrado"
        | "perdido"
        | "en_seguimiento"
      motivo_perdida_enum:
        | "precio"
        | "timing"
        | "no_era_decisor"
        | "se_fue_con_otro"
        | "no_respondio"
        | "otro"
      plataforma_enum:
        | "tiendanube"
        | "shopify"
        | "empretienda"
        | "woocommerce"
        | "vtex"
        | "desarrollo_propio"
        | "otro"
      vertical_enum:
        | "indumentaria"
        | "cosmetica"
        | "deco_hogar"
        | "electronica"
        | "deportes"
        | "alimentos"
        | "otro"
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
    Enums: {
      estado_oportunidad_enum: [
        "en_curso",
        "propuesta_enviada",
        "cerrado",
        "perdido",
        "en_seguimiento",
      ],
      motivo_perdida_enum: [
        "precio",
        "timing",
        "no_era_decisor",
        "se_fue_con_otro",
        "no_respondio",
        "otro",
      ],
      plataforma_enum: [
        "tiendanube",
        "shopify",
        "empretienda",
        "woocommerce",
        "vtex",
        "desarrollo_propio",
        "otro",
      ],
      vertical_enum: [
        "indumentaria",
        "cosmetica",
        "deco_hogar",
        "electronica",
        "deportes",
        "alimentos",
        "otro",
      ],
    },
  },
} as const
