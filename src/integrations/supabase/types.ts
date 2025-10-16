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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      candidaturas: {
        Row: {
          created_at: string
          id: string
          job_id: string
          montador_id: string
          observacoes: string | null
          proposta: number | null
          status: Database["public"]["Enums"]["candidatura_status"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          montador_id: string
          observacoes?: string | null
          proposta?: number | null
          status?: Database["public"]["Enums"]["candidatura_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          montador_id?: string
          observacoes?: string | null
          proposta?: number | null
          status?: Database["public"]["Enums"]["candidatura_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidaturas_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidaturas_montador_id_fkey"
            columns: ["montador_id"]
            isOneToOne: false
            referencedRelation: "montadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidaturas_montador_id_fkey"
            columns: ["montador_id"]
            isOneToOne: false
            referencedRelation: "montadores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      carteira: {
        Row: {
          created_at: string
          data_liberacao_admin: string | null
          id: string
          montador_id: string
          saldo_bloqueado: number | null
          saldo_disponivel: number | null
          saldo_em_processamento: number | null
          total_sacado: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_liberacao_admin?: string | null
          id?: string
          montador_id: string
          saldo_bloqueado?: number | null
          saldo_disponivel?: number | null
          saldo_em_processamento?: number | null
          total_sacado?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_liberacao_admin?: string | null
          id?: string
          montador_id?: string
          saldo_bloqueado?: number | null
          saldo_disponivel?: number | null
          saldo_em_processamento?: number | null
          total_sacado?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carteira_montador_id_fkey"
            columns: ["montador_id"]
            isOneToOne: true
            referencedRelation: "montadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carteira_montador_id_fkey"
            columns: ["montador_id"]
            isOneToOne: true
            referencedRelation: "montadores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      carteira_transacoes: {
        Row: {
          carteira_id: string
          created_at: string | null
          descricao: string
          id: string
          job_id: string | null
          pagamento_id: string | null
          processed_by: string | null
          tipo: string
          valor: number
        }
        Insert: {
          carteira_id: string
          created_at?: string | null
          descricao: string
          id?: string
          job_id?: string | null
          pagamento_id?: string | null
          processed_by?: string | null
          tipo: string
          valor: number
        }
        Update: {
          carteira_id?: string
          created_at?: string | null
          descricao?: string
          id?: string
          job_id?: string | null
          pagamento_id?: string | null
          processed_by?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          avaliacao_media: number | null
          created_at: string
          id: string
          pedidos_total: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avaliacao_media?: number | null
          created_at?: string
          id?: string
          pedidos_total?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avaliacao_media?: number | null
          created_at?: string
          id?: string
          pedidos_total?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          categoria: string | null
          cliente_id: string
          created_at: string
          data_opcoes: Json | null
          descricao: string
          endereco: Json
          id: string
          imagens_produtos: string[] | null
          montador_id: string | null
          nota_fiscal: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          categoria?: string | null
          cliente_id: string
          created_at?: string
          data_opcoes?: Json | null
          descricao: string
          endereco: Json
          id?: string
          imagens_produtos?: string[] | null
          montador_id?: string | null
          nota_fiscal?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          categoria?: string | null
          cliente_id?: string
          created_at?: string
          data_opcoes?: Json | null
          descricao?: string
          endereco?: Json
          id?: string
          imagens_produtos?: string[] | null
          montador_id?: string | null
          nota_fiscal?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_montador_id_fkey"
            columns: ["montador_id"]
            isOneToOne: false
            referencedRelation: "montadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_montador_id_fkey"
            columns: ["montador_id"]
            isOneToOne: false
            referencedRelation: "montadores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      montadores: {
        Row: {
          avaliacao_media: number | null
          badges: string[] | null
          chave_pix: string | null
          created_at: string
          documentos: Json | null
          especialidades: string[] | null
          foto_perfil_url: string | null
          horas_trabalhadas: number | null
          id: string
          is_premium: boolean | null
          nivel_gamificacao: string | null
          preco_hora: number | null
          projetos_realizados: number | null
          status: string | null
          total_avaliacoes: number | null
          total_valor_movimentado: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avaliacao_media?: number | null
          badges?: string[] | null
          chave_pix?: string | null
          created_at?: string
          documentos?: Json | null
          especialidades?: string[] | null
          foto_perfil_url?: string | null
          horas_trabalhadas?: number | null
          id?: string
          is_premium?: boolean | null
          nivel_gamificacao?: string | null
          preco_hora?: number | null
          projetos_realizados?: number | null
          status?: string | null
          total_avaliacoes?: number | null
          total_valor_movimentado?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avaliacao_media?: number | null
          badges?: string[] | null
          chave_pix?: string | null
          created_at?: string
          documentos?: Json | null
          especialidades?: string[] | null
          foto_perfil_url?: string | null
          horas_trabalhadas?: number | null
          id?: string
          is_premium?: boolean | null
          nivel_gamificacao?: string | null
          preco_hora?: number | null
          projetos_realizados?: number | null
          status?: string | null
          total_avaliacoes?: number | null
          total_valor_movimentado?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      negociacoes: {
        Row: {
          cliente_id: string
          created_at: string
          data_pagamento: string | null
          id: string
          job_id: string
          montador_id: string
          observacoes_cliente: string | null
          observacoes_montador: string | null
          pagamento_id: string | null
          status: string
          updated_at: string
          valor_final: number | null
          valor_proposto_cliente: number | null
          valor_proposto_montador: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          job_id: string
          montador_id: string
          observacoes_cliente?: string | null
          observacoes_montador?: string | null
          pagamento_id?: string | null
          status?: string
          updated_at?: string
          valor_final?: number | null
          valor_proposto_cliente?: number | null
          valor_proposto_montador?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          job_id?: string
          montador_id?: string
          observacoes_cliente?: string | null
          observacoes_montador?: string | null
          pagamento_id?: string | null
          status?: string
          updated_at?: string
          valor_final?: number | null
          valor_proposto_cliente?: number | null
          valor_proposto_montador?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "negociacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_montador_id_fkey"
            columns: ["montador_id"]
            isOneToOne: false
            referencedRelation: "montadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_montador_id_fkey"
            columns: ["montador_id"]
            isOneToOne: false
            referencedRelation: "montadores_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean | null
          mensagem: string
          tipo: Database["public"]["Enums"]["notificacao_tipo"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean | null
          mensagem: string
          tipo?: Database["public"]["Enums"]["notificacao_tipo"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean | null
          mensagem?: string
          tipo?: Database["public"]["Enums"]["notificacao_tipo"] | null
          user_id?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          cliente_id: string
          created_at: string
          failure_reason: string | null
          id: string
          installments: number | null
          job_id: string
          mercado_pago_payment_id: string | null
          mercado_pago_payment_method: string | null
          mercado_pago_preference_id: string | null
          metodo: Database["public"]["Enums"]["pagamento_metodo"] | null
          montador_id: string | null
          processed_at: string | null
          status: Database["public"]["Enums"]["pagamento_status"] | null
          transacao_gateway_id: string | null
          updated_at: string
          valor_total: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          installments?: number | null
          job_id: string
          mercado_pago_payment_id?: string | null
          mercado_pago_payment_method?: string | null
          mercado_pago_preference_id?: string | null
          metodo?: Database["public"]["Enums"]["pagamento_metodo"] | null
          montador_id?: string | null
          processed_at?: string | null
          status?: Database["public"]["Enums"]["pagamento_status"] | null
          transacao_gateway_id?: string | null
          updated_at?: string
          valor_total: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          installments?: number | null
          job_id?: string
          mercado_pago_payment_id?: string | null
          mercado_pago_payment_method?: string | null
          mercado_pago_preference_id?: string | null
          metodo?: Database["public"]["Enums"]["pagamento_metodo"] | null
          montador_id?: string | null
          processed_at?: string | null
          status?: Database["public"]["Enums"]["pagamento_status"] | null
          transacao_gateway_id?: string | null
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_montador_id_fkey"
            columns: ["montador_id"]
            isOneToOne: false
            referencedRelation: "montadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_montador_id_fkey"
            columns: ["montador_id"]
            isOneToOne: false
            referencedRelation: "montadores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          documento: string | null
          endereco: Json | null
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          documento?: string | null
          endereco?: Json | null
          id?: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          documento?: string | null
          endereco?: Json | null
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saques: {
        Row: {
          chave_pix: string | null
          created_at: string
          id: string
          montador_id: string
          processed_by: string | null
          status: Database["public"]["Enums"]["saque_status"] | null
          updated_at: string
          valor: number
        }
        Insert: {
          chave_pix?: string | null
          created_at?: string
          id?: string
          montador_id: string
          processed_by?: string | null
          status?: Database["public"]["Enums"]["saque_status"] | null
          updated_at?: string
          valor: number
        }
        Update: {
          chave_pix?: string | null
          created_at?: string
          id?: string
          montador_id?: string
          processed_by?: string | null
          status?: Database["public"]["Enums"]["saque_status"] | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "saques_montador_id_fkey"
            columns: ["montador_id"]
            isOneToOne: false
            referencedRelation: "montadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saques_montador_id_fkey"
            columns: ["montador_id"]
            isOneToOne: false
            referencedRelation: "montadores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      montadores_public: {
        Row: {
          avaliacao_media: number | null
          badges: string[] | null
          created_at: string | null
          especialidades: string[] | null
          foto_perfil_url: string | null
          horas_trabalhadas: number | null
          id: string | null
          is_premium: boolean | null
          nivel_gamificacao: string | null
          preco_hora: number | null
          projetos_realizados: number | null
          status: string | null
          total_avaliacoes: number | null
          total_valor_movimentado: number | null
          user_id: string | null
        }
        Insert: {
          avaliacao_media?: number | null
          badges?: string[] | null
          created_at?: string | null
          especialidades?: string[] | null
          foto_perfil_url?: string | null
          horas_trabalhadas?: number | null
          id?: string | null
          is_premium?: boolean | null
          nivel_gamificacao?: string | null
          preco_hora?: number | null
          projetos_realizados?: number | null
          status?: string | null
          total_avaliacoes?: number | null
          total_valor_movimentado?: number | null
          user_id?: string | null
        }
        Update: {
          avaliacao_media?: number | null
          badges?: string[] | null
          created_at?: string | null
          especialidades?: string[] | null
          foto_perfil_url?: string | null
          horas_trabalhadas?: number | null
          id?: string | null
          is_premium?: boolean | null
          nivel_gamificacao?: string | null
          preco_hora?: number | null
          projetos_realizados?: number | null
          status?: string | null
          total_avaliacoes?: number | null
          total_valor_movimentado?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_first_admin: {
        Args: {
          admin_email: string
          admin_name: string
          admin_password: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      liberar_valor_carteira: {
        Args: { p_admin_user_id: string; p_carteira_id: string }
        Returns: boolean
      }
      processar_pagamento_aprovado: {
        Args: {
          p_installments?: number
          p_mp_payment_id: string
          p_mp_payment_method: string
          p_pagamento_id: string
        }
        Returns: boolean
      }
      promote_to_admin: {
        Args: { target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client" | "montador"
      candidatura_status: "pendente" | "aceito" | "recusado"
      job_status:
        | "aberto"
        | "aguardando_pagamento"
        | "em_andamento"
        | "concluido"
        | "cancelado"
        | "em_negociacao"
      notificacao_tipo: "sistema" | "job" | "pagamento" | "saque" | "negociacao"
      pagamento_metodo: "pix" | "cartao"
      pagamento_status: "pago" | "pendente" | "estornado"
      saque_status: "solicitado" | "pago" | "rejeitado"
      user_role: "client" | "montador" | "admin"
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
      app_role: ["admin", "client", "montador"],
      candidatura_status: ["pendente", "aceito", "recusado"],
      job_status: [
        "aberto",
        "aguardando_pagamento",
        "em_andamento",
        "concluido",
        "cancelado",
        "em_negociacao",
      ],
      notificacao_tipo: ["sistema", "job", "pagamento", "saque", "negociacao"],
      pagamento_metodo: ["pix", "cartao"],
      pagamento_status: ["pago", "pendente", "estornado"],
      saque_status: ["solicitado", "pago", "rejeitado"],
      user_role: ["client", "montador", "admin"],
    },
  },
} as const
