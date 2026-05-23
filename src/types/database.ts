import type { SupabaseClient } from "@supabase/supabase-js"

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type StandardStatus = "draft" | "active" | "archived"
/** @deprecated use StandardStatus — DB enum `standard_status` */
export type SopStatus = StandardStatus
export type BusinessMemberRole = "owner" | "admin" | "member"

export type TrainingProgressStatus = "not_started" | "in_progress" | "completed"

export type DailyChecklistType =
  | "opening"
  | "closing"
  | "cleaning"
  | "production"
  | "quality_check"

export type DailyRunStatus = "in_progress" | "completed" | "abandoned"

export type IssueStatus = "open" | "in_progress" | "resolved"
/** DB column still uses enum `issue_status` on bottlenecks */
export type BottleneckStatus = IssueStatus

export type OwnerInterruptionKind =
  | "staff_ping"
  | "approval_request"
  | "judgment_call"
  | "unresolved_issue"
  | "owner_escalation"

export type EscapePlanStatus = "active" | "completed" | "archived"

export type EscapePlanTaskItemKind =
  | "milestone"
  | "operational_task"
  | "staff_assignment"
  | "standard_doc"
  | "risk_warning"

export type ReadinessBadge =
  | "not_ready"
  | "learning"
  | "ready_with_support"
  | "fully_ready"

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          name: string
          industry: string
          industry_template_id: string | null
          template_installed_at: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          industry?: string
          industry_template_id?: string | null
          template_installed_at?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          industry?: string
          industry_template_id?: string | null
          template_installed_at?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_playbooks: {
        Row: {
          id: string
          business_id: string
          playbook_type: "interruption" | "issue"
          title: string
          summary: string
          detail: string | null
          kind: string | null
          category: string | null
          severity: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          playbook_type: "interruption" | "issue"
          title: string
          summary: string
          detail?: string | null
          kind?: string | null
          category?: string | null
          severity?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          playbook_type?: "interruption" | "issue"
          title?: string
          summary?: string
          detail?: string | null
          kind?: string | null
          category?: string | null
          severity?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          business_id: string | null
          full_name: string
          role: string
          email: string
          is_owner: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          business_id?: string | null
          full_name: string
          role?: string
          email: string
          is_owner?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string | null
          full_name?: string
          role?: string
          email?: string
          is_owner?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          id: string
          business_id: string
          user_id: string
          role: BusinessMemberRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          role?: BusinessMemberRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          role?: BusinessMemberRole
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          business_id: string
          profile_id: string | null
          display_name: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          profile_id?: string | null
          display_name: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          profile_id?: string | null
          display_name?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          business_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: string
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: string
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: string
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      rivet_purchases: {
        Row: {
          id: string
          business_id: string
          purchaser_user_id: string | null
          stripe_customer_id: string | null
          stripe_checkout_session_id: string
          stripe_payment_intent_id: string | null
          amount: number
          currency: string
          status: string
          purchased_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          purchaser_user_id?: string | null
          stripe_customer_id?: string | null
          stripe_checkout_session_id: string
          stripe_payment_intent_id?: string | null
          amount: number
          currency?: string
          status?: string
          purchased_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          purchaser_user_id?: string | null
          stripe_customer_id?: string | null
          stripe_checkout_session_id?: string
          stripe_payment_intent_id?: string | null
          amount?: number
          currency?: string
          status?: string
          purchased_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      standards: {
        Row: {
          id: string
          business_id: string
          title: string
          category: string
          description: string | null
          importance_level: number
          owner_dependency_level: number
          estimated_time_minutes: number | null
          status: StandardStatus
          standards_capture: Json
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          title: string
          category?: string
          description?: string | null
          importance_level?: number
          owner_dependency_level?: number
          estimated_time_minutes?: number | null
          status?: StandardStatus
          standards_capture?: Json
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          title?: string
          category?: string
          description?: string | null
          importance_level?: number
          owner_dependency_level?: number
          estimated_time_minutes?: number | null
          status?: StandardStatus
          standards_capture?: Json
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      standard_steps: {
        Row: {
          id: string
          standard_id: string
          step_order: number
          title: string
          instructions: string
          media_url: string | null
          requires_photo_confirmation: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          standard_id: string
          step_order: number
          title: string
          instructions?: string
          media_url?: string | null
          requires_photo_confirmation?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          standard_id?: string
          step_order?: number
          title?: string
          instructions?: string
          media_url?: string | null
          requires_photo_confirmation?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      standard_media: {
        Row: {
          id: string
          business_id: string
          standard_id: string
          kind: string
          storage_path: string | null
          public_url: string | null
          caption: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          standard_id: string
          kind?: string
          storage_path?: string | null
          public_url?: string | null
          caption?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          standard_id?: string
          kind?: string
          storage_path?: string | null
          public_url?: string | null
          caption?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_modules: {
        Row: {
          id: string
          business_id: string
          title: string
          description: string | null
          assigned_role: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          title: string
          description?: string | null
          assigned_role?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          title?: string
          description?: string | null
          assigned_role?: string | null
          created_at?: string
        }
        Relationships: []
      }
      training_items: {
        Row: {
          id: string
          module_id: string
          standard_id: string
          required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          standard_id: string
          required?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          standard_id?: string
          required?: boolean
          created_at?: string
        }
        Relationships: []
      }
      training_progress: {
        Row: {
          id: string
          business_id: string
          employee_id: string
          training_module_id: string
          status: TrainingProgressStatus
          completed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          employee_id: string
          training_module_id: string
          status?: TrainingProgressStatus
          completed_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          employee_id?: string
          training_module_id?: string
          status?: TrainingProgressStatus
          completed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_checklists: {
        Row: {
          id: string
          business_id: string
          title: string
          type: DailyChecklistType
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          title: string
          type: DailyChecklistType
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          title?: string
          type?: DailyChecklistType
          created_at?: string
        }
        Relationships: []
      }
      daily_checklist_items: {
        Row: {
          id: string
          checklist_id: string
          text: string
          required_photo: boolean
          sort_order: number
        }
        Insert: {
          id?: string
          checklist_id: string
          text: string
          required_photo?: boolean
          sort_order?: number
        }
        Update: {
          id?: string
          checklist_id?: string
          text?: string
          required_photo?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      execution_records: {
        Row: {
          id: string
          checklist_id: string
          employee_id: string
          business_id: string
          status: DailyRunStatus
          started_at: string
          completed_at: string | null
          notes: string | null
          shift_date: string
          updated_at: string
        }
        Insert: {
          id?: string
          checklist_id: string
          employee_id: string
          business_id: string
          status?: DailyRunStatus
          started_at?: string
          completed_at?: string | null
          notes?: string | null
          shift_date?: string
          updated_at?: string
        }
        Update: {
          id?: string
          checklist_id?: string
          employee_id?: string
          business_id?: string
          status?: DailyRunStatus
          started_at?: string
          completed_at?: string | null
          notes?: string | null
          shift_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      execution_record_items: {
        Row: {
          id: string
          execution_record_id: string
          checklist_item_id: string
          completed: boolean
          photo_url: string | null
          note: string | null
          completed_at: string | null
          completed_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          execution_record_id: string
          checklist_item_id: string
          completed?: boolean
          photo_url?: string | null
          note?: string | null
          completed_at?: string | null
          completed_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          execution_record_id?: string
          checklist_item_id?: string
          completed?: boolean
          photo_url?: string | null
          note?: string | null
          completed_at?: string | null
          completed_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bottlenecks: {
        Row: {
          id: string
          business_id: string
          reported_by: string
          category: string
          severity: string
          title: string
          description: string | null
          status: IssueStatus
          owner_required: boolean
          created_at: string
          resolved_at: string | null
          execution_record_id: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          reported_by: string
          category?: string
          severity?: string
          title: string
          description?: string | null
          status?: IssueStatus
          owner_required?: boolean
          created_at?: string
          resolved_at?: string | null
          execution_record_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          reported_by?: string
          category?: string
          severity?: string
          title?: string
          description?: string | null
          status?: IssueStatus
          owner_required?: boolean
          created_at?: string
          resolved_at?: string | null
          execution_record_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      owner_interruptions: {
        Row: {
          id: string
          business_id: string
          logged_by: string
          kind: OwnerInterruptionKind
          summary: string
          detail: string | null
          estimated_minutes: number
          related_bottleneck_id: string | null
          occurred_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          logged_by: string
          kind: OwnerInterruptionKind
          summary: string
          detail?: string | null
          estimated_minutes?: number
          related_bottleneck_id?: string | null
          occurred_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          logged_by?: string
          kind?: OwnerInterruptionKind
          summary?: string
          detail?: string | null
          estimated_minutes?: number
          related_bottleneck_id?: string | null
          occurred_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_training_sop_completions: {
        Row: {
          id: string
          employee_id: string
          training_item_id: string
          completed_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          training_item_id: string
          completed_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          training_item_id?: string
          completed_at?: string
        }
        Relationships: []
      }
      employee_readiness: {
        Row: {
          id: string
          business_id: string
          employee_id: string
          open_alone: ReadinessBadge
          close_alone: ReadinessBadge
          train_others: ReadinessBadge
          handle_complaints: ReadinessBadge
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          employee_id: string
          open_alone?: ReadinessBadge
          close_alone?: ReadinessBadge
          train_others?: ReadinessBadge
          handle_complaints?: ReadinessBadge
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          employee_id?: string
          open_alone?: ReadinessBadge
          close_alone?: ReadinessBadge
          train_others?: ReadinessBadge
          handle_complaints?: ReadinessBadge
          updated_at?: string
        }
        Relationships: []
      }
      owner_escape_plans: {
        Row: {
          id: string
          business_id: string
          created_by: string
          started_on: string
          status: EscapePlanStatus
          intake_json: unknown
          plan_version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          created_by: string
          started_on?: string
          status?: EscapePlanStatus
          intake_json?: unknown
          plan_version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          created_by?: string
          started_on?: string
          status?: EscapePlanStatus
          intake_json?: unknown
          plan_version?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      owner_escape_plan_tasks: {
        Row: {
          id: string
          plan_id: string
          week_number: number
          task_key: string | null
          title: string
          description: string | null
          sort_order: number
          notes: string | null
          completed_at: string | null
          completed_by: string | null
          item_kind: EscapePlanTaskItemKind
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          week_number: number
          task_key?: string | null
          title: string
          description?: string | null
          sort_order?: number
          notes?: string | null
          completed_at?: string | null
          completed_by?: string | null
          item_kind?: EscapePlanTaskItemKind
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          week_number?: number
          task_key?: string | null
          title?: string
          description?: string | null
          sort_order?: number
          notes?: string | null
          completed_at?: string | null
          completed_by?: string | null
          item_kind?: EscapePlanTaskItemKind
          created_at?: string
        }
        Relationships: []
      }
      reality_checks: {
        Row: {
          id: string
          business_id: string
          score: string
          assessment_json: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          score: number | string
          assessment_json?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          score?: number | string
          assessment_json?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      handoff_score_snapshots: {
        Row: {
          id: string
          business_id: string
          snapshot_date: string
          dependency_score: number
          autonomy_score: number
          category_scores: Json
          critical_warnings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          snapshot_date: string
          dependency_score: number
          autonomy_score: number
          category_scores?: Json
          critical_warnings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          snapshot_date?: string
          dependency_score?: number
          autonomy_score?: number
          category_scores?: Json
          critical_warnings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      scan_leads: {
        Row: {
          id: string
          created_at: string
          business_name: string
          website: string
          industry: string
          employees: number
          locations: number
          owner_interruptions: string
          procedures_documented: boolean
          training_published: boolean
          recurring_issues_tracked: boolean
          email: string
          rivet_index: number
          founder_dependency: string
          execution_drift: number
          training_fragility: number
          owner_routing: number
          owner_dependency_score: number | null
          severity: string | null
          est_interruptions_month: number | null
          est_hours_lost_month: number | null
          est_annual_cost: number | null
          scan_version: string | null
          scan_answers: Record<string, unknown> | null
        }
        Insert: {
          id?: string
          created_at?: string
          business_name: string
          website?: string
          industry: string
          employees: number
          locations: number
          owner_interruptions: string
          procedures_documented: boolean
          training_published: boolean
          recurring_issues_tracked: boolean
          email: string
          rivet_index: number
          founder_dependency: string
          execution_drift: number
          training_fragility: number
          owner_routing: number
          owner_dependency_score?: number | null
          severity?: string | null
          est_interruptions_month?: number | null
          est_hours_lost_month?: number | null
          est_annual_cost?: number | null
          scan_version?: string | null
          scan_answers?: Record<string, unknown> | null
        }
        Update: {
          id?: string
          created_at?: string
          business_name?: string
          website?: string
          industry?: string
          employees?: number
          locations?: number
          owner_interruptions?: string
          procedures_documented?: boolean
          training_published?: boolean
          recurring_issues_tracked?: boolean
          email?: string
          rivet_index?: number
          founder_dependency?: string
          execution_drift?: number
          training_fragility?: number
          owner_routing?: number
          owner_dependency_score?: number | null
          severity?: string | null
          est_interruptions_month?: number | null
          est_hours_lost_month?: number | null
          est_annual_cost?: number | null
          scan_version?: string | null
          scan_answers?: Record<string, unknown> | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      user_can_access_business: {
        Args: { p_business_id: string }
        Returns: boolean
      }
      current_user_business_id: {
        Args: Record<string, never>
        Returns: string | null
      }
      auth_user_is_owner: {
        Args: Record<string, never>
        Returns: boolean
      }
      create_business_workspace: {
        Args: { p_name: string; p_industry?: string }
        Returns: string
      }
    }
    Enums: {
      standard_status: StandardStatus
      business_member_role: BusinessMemberRole
      training_progress_status: TrainingProgressStatus
      daily_checklist_type: DailyChecklistType
      daily_run_status: DailyRunStatus
      issue_status: IssueStatus
      owner_interruption_kind: OwnerInterruptionKind
      readiness_badge: ReadinessBadge
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

export type TypedSupabaseClient = SupabaseClient<Database>
