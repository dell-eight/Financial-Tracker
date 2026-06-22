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
      asset_accounts: {
        Row: {
          asset_type: string
          balance: number
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          description: string | null
          id: string
          institution: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_type: string
          balance: number
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          institution?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_type?: string
          balance?: number
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          institution?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "asset_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "asset_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_accounts: {
        Row: {
          annual_rate: number | null
          balance: number
          created_at: string | null
          currency: string | null
          debt_type: string
          deleted_at: string | null
          description: string | null
          due_date: number | null
          id: string
          institution: string | null
          minimum_payment: number | null
          monthly_payment: number | null
          name: string
          original_amount: number | null
          payoff_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annual_rate?: number | null
          balance: number
          created_at?: string | null
          currency?: string | null
          debt_type: string
          deleted_at?: string | null
          description?: string | null
          due_date?: number | null
          id?: string
          institution?: string | null
          minimum_payment?: number | null
          monthly_payment?: number | null
          name: string
          original_amount?: number | null
          payoff_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annual_rate?: number | null
          balance?: number
          created_at?: string | null
          currency?: string | null
          debt_type?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: number | null
          id?: string
          institution?: string | null
          minimum_payment?: number | null
          monthly_payment?: number | null
          name?: string
          original_amount?: number | null
          payoff_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "debt_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "debt_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          budget_limit: number | null
          budget_period: string | null
          color: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_recurring: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_limit?: number | null
          budget_period?: string | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_recurring?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_limit?: number | null
          budget_period?: string | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_recurring?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expense_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expense_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string
          created_at: string | null
          date: string
          deleted_at: string | null
          description: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          receipt_url: string | null
          recurring_end_date: string | null
          recurring_frequency: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id: string
          created_at?: string | null
          date: string
          deleted_at?: string | null
          description: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          receipt_url?: string | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string
          created_at?: string | null
          date?: string
          deleted_at?: string | null
          description?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          receipt_url?: string | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "asset_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_vs_actual"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_trends"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "monthly_expense_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_budget_performance"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mv_expense_analytics"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      income_records: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string | null
          date: string
          deleted_at: string | null
          description: string | null
          id: string
          notes: string | null
          source_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string | null
          date: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          source_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          date?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          source_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_records_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "asset_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_records_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "income_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_records_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "income_trends"
            referencedColumns: ["source_id"]
          },
          {
            foreignKeyName: "income_records_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "monthly_income_summary"
            referencedColumns: ["source_id"]
          },
          {
            foreignKeyName: "income_records_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "mv_income_analysis"
            referencedColumns: ["source_id"]
          },
          {
            foreignKeyName: "income_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "income_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "income_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      income_sources: {
        Row: {
          color: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_recurring: boolean | null
          name: string
          recurring_frequency: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_recurring?: boolean | null
          name: string
          recurring_frequency?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_recurring?: boolean | null
          name?: string
          recurring_frequency?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_sources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "income_sources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "income_sources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_accounts: {
        Row: {
          account_number: string | null
          account_type: string
          balance: number | null
          color: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          description: string | null
          icon: string | null
          id: string
          institution: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          account_type: string
          balance?: number | null
          color?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          institution?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          account_type?: string
          balance?: number | null
          color?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          institution?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investment_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investment_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      other_assets: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          value: number
          purchase_value: number | null
          purchase_date: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          category: string
          value: number
          purchase_value?: number | null
          purchase_date?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          name?: string
          category?: string
          value?: number
          purchase_value?: number | null
          purchase_date?: string | null
          notes?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      investment_holdings: {
        Row: {
          account_id: string
          asset_class: string
          created_at: string | null
          currency: string | null
          current_price: number
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
          purchase_date: string
          purchase_price: number
          sector: string | null
          shares: number
          symbol: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          asset_class: string
          created_at?: string | null
          currency?: string | null
          current_price: number
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
          purchase_date: string
          purchase_price: number
          sector?: string | null
          shares: number
          symbol: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          asset_class?: string
          created_at?: string | null
          currency?: string | null
          current_price?: number
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          purchase_date?: string
          purchase_price?: number
          sector?: string | null
          shares?: number
          symbol?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_holdings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "investment_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_holdings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "investment_summary"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "investment_holdings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mv_investment_performance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "investment_holdings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investment_holdings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investment_holdings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_transactions: {
        Row: {
          account_id: string
          created_at: string | null
          date: string
          description: string | null
          fee: number | null
          holding_id: string | null
          id: string
          notes: string | null
          price_per_share: number | null
          shares: number | null
          symbol: string | null
          total_amount: number
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          date: string
          description?: string | null
          fee?: number | null
          holding_id?: string | null
          id?: string
          notes?: string | null
          price_per_share?: number | null
          shares?: number | null
          symbol?: string | null
          total_amount: number
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          date?: string
          description?: string | null
          fee?: number | null
          holding_id?: string | null
          id?: string
          notes?: string | null
          price_per_share?: number | null
          shares?: number | null
          symbol?: string | null
          total_amount?: number
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "investment_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "investment_summary"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "investment_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mv_investment_performance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "investment_transactions_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "investment_holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_transactions_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "mv_investment_performance"
            referencedColumns: ["holding_id"]
          },
          {
            foreignKeyName: "investment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      net_worth_snapshots: {
        Row: {
          captured_at: string
          created_at: string | null
          id: string
          investments: number | null
          liquid_assets: number | null
          net_worth: number
          other_assets: number | null
          real_estate: number | null
          snapshot_date: string
          total_assets: number
          total_debts: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          captured_at?: string
          created_at?: string | null
          id?: string
          investments?: number | null
          liquid_assets?: number | null
          net_worth: number
          other_assets?: number | null
          real_estate?: number | null
          snapshot_date: string
          total_assets: number
          total_debts: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          captured_at?: string
          created_at?: string | null
          id?: string
          investments?: number | null
          liquid_assets?: number | null
          net_worth?: number
          other_assets?: number | null
          real_estate?: number | null
          snapshot_date?: string
          total_assets?: number
          total_debts?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "net_worth_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "net_worth_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "net_worth_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          dedupe_key: string | null
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          dedupe_key?: string | null
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          dedupe_key?: string | null
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_goal_contributions: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string | null
          date: string
          description: string | null
          goal_id: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string | null
          date: string
          description?: string | null
          goal_id: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          date?: string
          description?: string | null
          goal_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_goal_contributions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "asset_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "mv_financial_goals_progress"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "savings_goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goal_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_goal_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "savings_goal_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "savings_goal_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          current_amount: number | null
          deleted_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          target_amount: number
          target_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          target_amount: number
          target_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          target_amount?: number
          target_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "savings_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "savings_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          from_account_id: string
          id: string
          notes: string | null
          to_account_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          from_account_id: string
          id?: string
          notes?: string | null
          to_account_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          from_account_id?: string
          id?: string
          notes?: string | null
          to_account_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "asset_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "asset_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_security_settings: {
        Row: {
          auto_lock_minutes: number
          biometric_enabled: boolean
          created_at: string
          id: string
          pin_enabled: boolean
          screenshot_privacy: boolean
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_lock_minutes?: number
          biometric_enabled?: boolean
          created_at?: string
          id?: string
          pin_enabled?: boolean
          screenshot_privacy?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_lock_minutes?: number
          biometric_enabled?: boolean
          created_at?: string
          id?: string
          pin_enabled?: boolean
          screenshot_privacy?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          base_currency: string
          created_at: string | null
          deleted_at: string | null
          display_name: string | null
          email: string
          fiscal_year_start: number
          id: string
          timezone: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          base_currency?: string
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email: string
          fiscal_year_start?: number
          id?: string
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          base_currency?: string
          created_at?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string
          fiscal_year_start?: number
          id?: string
          timezone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      wealth_milestones: {
        Row: {
          achieved_at: string | null
          celebrated: boolean
          id: string
          milestone_type: string
          net_worth_at_achievement: number | null
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          celebrated?: boolean
          id?: string
          milestone_type: string
          net_worth_at_achievement?: number | null
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          celebrated?: boolean
          id?: string
          milestone_type?: string
          net_worth_at_achievement?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wealth_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wealth_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wealth_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      asset_allocation: {
        Row: {
          allocation_percent: number | null
          asset_class: string | null
          num_holdings: number | null
          total_cost: number | null
          total_gain_loss: number | null
          total_value: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_holdings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investment_holdings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investment_holdings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_vs_actual: {
        Row: {
          actual_spent: number | null
          budget_limit: number | null
          category_id: string | null
          category_name: string | null
          month: string | null
          percent_of_budget: number | null
          remaining_budget: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_trends: {
        Row: {
          avg_transaction: number | null
          category_id: string | null
          category_name: string | null
          month: string | null
          month_num: number | null
          total_amount: number | null
          transaction_count: number | null
          user_id: string | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_health_metrics: {
        Row: {
          as_of_date: string | null
          emergency_fund_months: number | null
          monthly_expenses: number | null
          monthly_income: number | null
          net_worth: number | null
          savings_rate_percent: number | null
          total_assets: number | null
          total_debt: number | null
          user_id: string | null
        }
        Insert: {
          as_of_date?: never
          emergency_fund_months?: never
          monthly_expenses?: never
          monthly_income?: never
          net_worth?: never
          savings_rate_percent?: never
          total_assets?: never
          total_debt?: never
          user_id?: string | null
        }
        Update: {
          as_of_date?: never
          emergency_fund_months?: never
          monthly_expenses?: never
          monthly_income?: never
          net_worth?: never
          savings_rate_percent?: never
          total_assets?: never
          total_debt?: never
          user_id?: string | null
        }
        Relationships: []
      }
      income_trends: {
        Row: {
          month: string | null
          month_num: number | null
          source_id: string | null
          source_name: string | null
          total_amount: number | null
          transaction_count: number | null
          user_id: string | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "income_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "income_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "income_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_summary: {
        Row: {
          account_id: string | null
          account_name: string | null
          account_type: string | null
          asset_class: string | null
          cost_basis: number | null
          current_price: number | null
          current_value: number | null
          gain_loss_percent: number | null
          holding_name: string | null
          purchase_price: number | null
          sector: string | null
          shares: number | null
          symbol: string | null
          unrealized_gain_loss: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_holdings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investment_holdings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investment_holdings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_cash_flow: {
        Row: {
          month: string | null
          net_cash_flow: number | null
          total_expenses: number | null
          total_income: number | null
          user_id: string | null
        }
        Relationships: []
      }
      monthly_expense_summary: {
        Row: {
          avg_amount: number | null
          category_id: string | null
          category_name: string | null
          color: string | null
          max_amount: number | null
          min_amount: number | null
          month: string | null
          total_amount: number | null
          transaction_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_income_summary: {
        Row: {
          avg_amount: number | null
          color: string | null
          month: string | null
          source_id: string | null
          source_name: string | null
          total_amount: number | null
          transaction_count: number | null
          type: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "income_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "income_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_annual_summary: {
        Row: {
          annual_expenses: number | null
          annual_income: number | null
          annual_net_savings: number | null
          calculated_date: string | null
          user_id: string | null
          year: number | null
        }
        Relationships: []
      }
      mv_asset_allocation_history: {
        Row: {
          allocation_percent: number | null
          asset_type: string | null
          snapshot_date: string | null
          user_id: string | null
          value: number | null
        }
        Relationships: []
      }
      mv_budget_performance: {
        Row: {
          actual_spent: number | null
          avg_12_month_spending: number | null
          budget_limit: number | null
          category_id: string | null
          category_name: string | null
          month: string | null
          percent_of_budget: number | null
          remaining_budget: number | null
          status: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_expense_analytics: {
        Row: {
          avg_12_month: number | null
          avg_transaction: number | null
          category_id: string | null
          category_name: string | null
          max_12_month: number | null
          min_12_month: number | null
          month: string | null
          monthly_total: number | null
          transaction_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_financial_goals_progress: {
        Row: {
          category: string | null
          current_amount: number | null
          daily_required_savings: number | null
          days_remaining: number | null
          goal_id: string | null
          is_active: boolean | null
          name: string | null
          priority: number | null
          progress_percent: number | null
          status: string | null
          target_amount: number | null
          target_date: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "savings_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "savings_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_income_analysis: {
        Row: {
          avg_12_month: number | null
          max_12_month: number | null
          min_12_month: number | null
          month: string | null
          monthly_income: number | null
          source_id: string | null
          source_name: string | null
          transaction_count: number | null
          type: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "income_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "income_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_investment_performance: {
        Row: {
          account_id: string | null
          account_name: string | null
          account_type: string | null
          asset_class: string | null
          cost_basis: number | null
          current_price: number | null
          current_value: number | null
          gain_loss_percent: number | null
          holding_id: string | null
          holding_name: string | null
          performance_status: string | null
          portfolio_percent: number | null
          purchase_price: number | null
          sector: string | null
          shares: number | null
          symbol: string | null
          unrealized_gain_loss: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_holdings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investment_holdings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "investment_holdings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_net_worth_history: {
        Row: {
          investments: number | null
          liquid_assets: number | null
          monthly_net_worth_change: number | null
          monthly_net_worth_change_percent: number | null
          net_worth: number | null
          previous_month_net_worth: number | null
          real_estate: number | null
          snapshot_date: string | null
          total_assets: number | null
          total_debts: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "net_worth_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "net_worth_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "net_worth_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      net_worth_detail: {
        Row: {
          amount: number | null
          category: string | null
          net_worth: number | null
          total_debt: number | null
          user_id: string | null
        }
        Relationships: []
      }
      savings_goal_status: {
        Row: {
          category: string | null
          color: string | null
          current_amount: number | null
          daily_required_savings: number | null
          days_remaining: number | null
          description: string | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          progress_percent: number | null
          target_amount: number | null
          target_date: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "financial_health_metrics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "savings_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mv_annual_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "savings_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_user_net_worth: {
        Args: { p_date?: string; p_user_id: string }
        Returns: number
      }
      delete_investment_holding: {
        Args: { p_holding_id: string }
        Returns: undefined
      }
      get_dashboard_summary: {
        Args: { p_user_id: string }
        Returns: {
          emergency_fund_months: number
          goals_completed: number
          income_90d: number
          investment_value: number
          monthly_expenses: number
          monthly_income: number
          monthly_savings: number
          net_worth: number
          number_of_goals: number
          savings_rate_3m: number
          savings_rate_percent: number
          total_assets: number
          total_debts: number
        }[]
      }
      get_expense_breakdown_by_category: {
        Args: { p_months_back?: number; p_user_id: string }
        Returns: {
          average_transaction: number
          category_id: string
          category_name: string
          color: string
          percent_of_total: number
          total_spent: number
          transaction_count: number
        }[]
      }
      get_expense_trends: {
        Args: {
          p_category_id?: string
          p_months_back?: number
          p_user_id: string
        }
        Returns: {
          amount: number
          avg_transaction: number
          category_name: string
          month: string
          transaction_count: number
        }[]
      }
      get_financial_metrics: {
        Args: { p_user_id: string }
        Returns: {
          last_updated: string
          metric_name: string
          metric_unit: string
          metric_value: number
          trend_direction: string
        }[]
      }
      get_income_breakdown: {
        Args: { p_months_back?: number; p_user_id: string }
        Returns: {
          color: string
          income_type: string
          percent_of_total: number
          source_id: string
          source_name: string
          total_income: number
          transaction_count: number
        }[]
      }
      get_monthly_budget_comparison: {
        Args: { p_month?: number; p_user_id: string; p_year?: number }
        Returns: {
          actual_spent: number
          budget_limit: number
          category_id: string
          category_name: string
          color: string
          percent_of_budget: number
          remaining_budget: number
          status: string
        }[]
      }
      get_net_worth_trend: {
        Args: { p_months_back?: number; p_user_id: string }
        Returns: {
          monthly_change: number
          monthly_change_percent: number
          net_worth: number
          snapshot_date: string
          total_assets: number
          total_debts: number
        }[]
      }
      get_portfolio_allocation: {
        Args: { p_user_id: string }
        Returns: {
          allocation_percent: number
          asset_class: string
          gain_loss: number
          gain_loss_percent: number
          holding_count: number
          total_value: number
        }[]
      }
      get_savings_goals_progress: {
        Args: { p_user_id: string }
        Returns: {
          category: string
          color: string
          current_amount: number
          daily_required_savings: number
          days_remaining: number
          goal_id: string
          goal_name: string
          is_active: boolean
          progress_percent: number
          status: string
          target_amount: number
          target_date: string
        }[]
      }
      refresh_materialized_views: { Args: never; Returns: undefined }
      upsert_net_worth_snapshot:
        | {
            Args: {
              p_investments: number
              p_liquid_assets: number
              p_net_worth: number
              p_other_assets: number
              p_real_estate: number
              p_snapshot_date: string
              p_total_assets: number
              p_total_debts: number
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_captured_at?: string
              p_investments: number
              p_liquid_assets: number
              p_net_worth: number
              p_other_assets: number
              p_real_estate: number
              p_snapshot_date: string
              p_total_assets: number
              p_total_debts: number
              p_user_id: string
            }
            Returns: undefined
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
