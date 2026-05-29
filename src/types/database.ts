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
export type BusinessMemberRole = "owner" | "manager" | "trainer" | "staff" | "admin" | "member"

export type WorkspaceInviteStatus = "pending" | "accepted" | "revoked"

export type AskRivetReviewStatus = "auto_approved" | "pending" | "approved" | "improved"

export type TrainingProgressStatus = "not_started" | "in_progress" | "completed"

export type DailyChecklistType =
  | "opening"
  | "closing"
  | "cleaning"
  | "production"
  | "quality_check"

export type DailyRunStatus = "in_progress" | "completed" | "abandoned"

export type IssueStatus = "not_started" | "investigating" | "fix_in_progress" | "resolved"
/** DB column still uses enum `issue_status` on bottlenecks */
export type BottleneckStatus = IssueStatus

export type IssueLinkKind = "standard" | "training_module" | "owner_interruption" | "staff_member"

export type IssueLifecycleStage =
  | "logged"
  | "pattern_detected"
  | "fix_suggested"
  | "training_assigned"
  | "progress_tracked"
  | "dependency_updated"

export type OwnerInterruptionKind =
  | "staff_ping"
  | "approval_request"
  | "judgment_call"
  | "unresolved_issue"
  | "owner_escalation"

export type OwnerInterruptionUrgency = "can_wait" | "today" | "time_sensitive" | "right_now"

export type OwnerInterruptionSeverity = "small_pull" | "medium_pull" | "heavy_pull" | "emergency"

export type InterruptionActionPlanStatus = "draft" | "approved" | "published" | "dismissed"

export type InterruptionActionFixType = "sop" | "training_module"

export type OwnerInterruptionSource =
  | "text_message"
  | "phone_call"
  | "in_person"
  | "slack"
  | "email"
  | "other"

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

export type DelegationReadinessStatus = "ready" | "needs_work"

export type ManagerObservationType = "positive" | "improvement" | "critical"

export type TrainingInviteChannel = "email" | "sms" | "link"

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
          owner_hourly_value_cad: number | null
          billing_plan: string | null
          founder_grandfathered_at: string | null
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
          owner_hourly_value_cad?: number | null
          billing_plan?: string | null
          founder_grandfathered_at?: string | null
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
          owner_hourly_value_cad?: number | null
          billing_plan?: string | null
          founder_grandfathered_at?: string | null
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
      workspace_invites: {
        Row: {
          id: string
          business_id: string
          email: string
          role: BusinessMemberRole
          token: string
          status: WorkspaceInviteStatus
          invited_by: string
          expires_at: string
          accepted_at: string | null
          accepted_by_user_id: string | null
          revoked_at: string | null
          last_sent_at: string | null
          send_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          email: string
          role: BusinessMemberRole
          token: string
          status?: WorkspaceInviteStatus
          invited_by: string
          expires_at: string
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          revoked_at?: string | null
          last_sent_at?: string | null
          send_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          email?: string
          role?: BusinessMemberRole
          token?: string
          status?: WorkspaceInviteStatus
          invited_by?: string
          expires_at?: string
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          revoked_at?: string | null
          last_sent_at?: string | null
          send_count?: number
          created_at?: string
          updated_at?: string
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
          play_metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          profile_id?: string | null
          display_name: string
          notes?: string | null
          play_metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          profile_id?: string | null
          display_name?: string
          notes?: string | null
          play_metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_succession_roles: {
        Row: {
          id: string
          business_id: string
          role_label: string
          capability_field: string | null
          primary_profile_id: string | null
          backup_profile_id: string | null
          sort_order: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          role_label: string
          capability_field?: string | null
          primary_profile_id?: string | null
          backup_profile_id?: string | null
          sort_order?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          role_label?: string
          capability_field?: string | null
          primary_profile_id?: string | null
          backup_profile_id?: string | null
          sort_order?: number
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
          product_plan: string
          payment_option: string | null
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
          product_plan?: string
          payment_option?: string | null
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
          product_plan?: string
          payment_option?: string | null
          purchased_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          created_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          created_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          created_at?: string
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
          quiz_questions: Json
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
          quiz_questions?: Json
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
          quiz_questions?: Json
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
          requires_video_proof: boolean
          requires_manager_signoff: boolean
          requires_checklist_completion: boolean
          estimated_time_minutes: number | null
          is_critical: boolean
          verification: string | null
          notes: string | null
          play_metadata: Json
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
          requires_video_proof?: boolean
          requires_manager_signoff?: boolean
          requires_checklist_completion?: boolean
          estimated_time_minutes?: number | null
          is_critical?: boolean
          verification?: string | null
          notes?: string | null
          play_metadata?: Json
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
          requires_video_proof?: boolean
          requires_manager_signoff?: boolean
          requires_checklist_completion?: boolean
          estimated_time_minutes?: number | null
          is_critical?: boolean
          verification?: string | null
          notes?: string | null
          play_metadata?: Json
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
      training_portal_invites: {
        Row: {
          id: string
          business_id: string
          training_module_id: string
          employee_id: string | null
          token: string
          recipient_email: string | null
          recipient_phone: string | null
          channel: TrainingInviteChannel
          created_by: string
          expires_at: string
          last_opened_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          training_module_id: string
          employee_id?: string | null
          token: string
          recipient_email?: string | null
          recipient_phone?: string | null
          channel?: TrainingInviteChannel
          created_by: string
          expires_at?: string
          last_opened_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          training_module_id?: string
          employee_id?: string | null
          token?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          channel?: TrainingInviteChannel
          created_by?: string
          expires_at?: string
          last_opened_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      training_sop_progress: {
        Row: {
          id: string
          business_id: string
          employee_id: string
          training_item_id: string
          step_checklist: Json
          video_watched_at: string | null
          quiz_passed: boolean
          quiz_answers: Json
          photo_proofs: Json
          step_proofs: Json
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          employee_id: string
          training_item_id: string
          step_checklist?: Json
          video_watched_at?: string | null
          quiz_passed?: boolean
          quiz_answers?: Json
          photo_proofs?: Json
          step_proofs?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          employee_id?: string
          training_item_id?: string
          step_checklist?: Json
          video_watched_at?: string | null
          quiz_passed?: boolean
          quiz_answers?: Json
          photo_proofs?: Json
          step_proofs?: Json
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
          owner_id: string | null
          due_date: string | null
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
          owner_id?: string | null
          due_date?: string | null
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
          owner_id?: string | null
          due_date?: string | null
          created_at?: string
          resolved_at?: string | null
          execution_record_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      issue_links: {
        Row: {
          id: string
          bottleneck_id: string
          business_id: string
          kind: IssueLinkKind
          target_id: string
          created_at: string
        }
        Insert: {
          id?: string
          bottleneck_id: string
          business_id: string
          kind: IssueLinkKind
          target_id: string
          created_at?: string
        }
        Update: {
          id?: string
          bottleneck_id?: string
          business_id?: string
          kind?: IssueLinkKind
          target_id?: string
          created_at?: string
        }
        Relationships: []
      }
      issue_lifecycle_events: {
        Row: {
          id: string
          bottleneck_id: string
          business_id: string
          stage: IssueLifecycleStage
          detail: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          bottleneck_id: string
          business_id: string
          stage: IssueLifecycleStage
          detail?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          bottleneck_id?: string
          business_id?: string
          stage?: IssueLifecycleStage
          detail?: string | null
          metadata?: Json
          created_at?: string
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
          urgency: OwnerInterruptionUrgency
          source: OwnerInterruptionSource
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
          urgency?: OwnerInterruptionUrgency
          source?: OwnerInterruptionSource
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
          urgency?: OwnerInterruptionUrgency
          source?: OwnerInterruptionSource
          related_bottleneck_id?: string | null
          occurred_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      rivet_ask_queries: {
        Row: {
          id: string
          business_id: string
          asked_by: string | null
          question_text: string
          normalized_question: string
          standard_id: string | null
          matched_source: string | null
          response: Json
          prevented_owner_interrupt: boolean
          review_status: AskRivetReviewStatus
          reviewed_by: string | null
          reviewed_at: string | null
          owner_improved_answer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          asked_by?: string | null
          question_text: string
          normalized_question: string
          standard_id?: string | null
          matched_source?: string | null
          response?: Json
          prevented_owner_interrupt?: boolean
          review_status?: AskRivetReviewStatus
          reviewed_by?: string | null
          reviewed_at?: string | null
          owner_improved_answer?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          asked_by?: string | null
          question_text?: string
          normalized_question?: string
          standard_id?: string | null
          matched_source?: string | null
          response?: Json
          prevented_owner_interrupt?: boolean
          review_status?: AskRivetReviewStatus
          reviewed_by?: string | null
          reviewed_at?: string | null
          owner_improved_answer?: string | null
          created_at?: string
        }
        Relationships: []
      }
      rivet_high_friction_procedures: {
        Row: {
          id: string
          business_id: string
          normalized_question: string
          display_question: string
          ask_count: number
          standard_id: string | null
          status: "open" | "acknowledged" | "resolved"
          first_asked_at: string
          last_asked_at: string
        }
        Insert: {
          id?: string
          business_id: string
          normalized_question: string
          display_question: string
          ask_count?: number
          standard_id?: string | null
          status?: "open" | "acknowledged" | "resolved"
          first_asked_at?: string
          last_asked_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          normalized_question?: string
          display_question?: string
          ask_count?: number
          standard_id?: string | null
          status?: "open" | "acknowledged" | "resolved"
          first_asked_at?: string
          last_asked_at?: string
        }
        Relationships: []
      }
      standard_play_views: {
        Row: {
          id: string
          business_id: string
          standard_id: string
          viewed_by: string | null
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          standard_id: string
          viewed_by?: string | null
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          standard_id?: string
          viewed_by?: string | null
          source?: string
          created_at?: string
        }
        Relationships: []
      }
      interruption_action_plans: {
        Row: {
          id: string
          business_id: string
          interruption_id: string
          status: InterruptionActionPlanStatus
          fix_type: InterruptionActionFixType
          root_cause: string
          suggested_title: string
          suggested_description: string | null
          related_standard_id: string | null
          related_module_id: string | null
          draft_standard_id: string | null
          draft_module_id: string | null
          affected_people: Json
          ai_payload: Json
          approved_by: string | null
          approved_at: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          interruption_id: string
          status?: InterruptionActionPlanStatus
          fix_type: InterruptionActionFixType
          root_cause: string
          suggested_title: string
          suggested_description?: string | null
          related_standard_id?: string | null
          related_module_id?: string | null
          draft_standard_id?: string | null
          draft_module_id?: string | null
          affected_people?: Json
          ai_payload?: Json
          approved_by?: string | null
          approved_at?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          interruption_id?: string
          status?: InterruptionActionPlanStatus
          fix_type?: InterruptionActionFixType
          root_cause?: string
          suggested_title?: string
          suggested_description?: string | null
          related_standard_id?: string | null
          related_module_id?: string | null
          draft_standard_id?: string | null
          draft_module_id?: string | null
          affected_people?: Json
          ai_payload?: Json
          approved_by?: string | null
          approved_at?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_standard_quiz_completions: {
        Row: {
          id: string
          business_id: string
          employee_id: string
          standard_id: string
          score: number
          passed: boolean
          answers: Json
          completed_at: string
        }
        Insert: {
          id?: string
          business_id: string
          employee_id: string
          standard_id: string
          score: number
          passed?: boolean
          answers?: Json
          completed_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          employee_id?: string
          standard_id?: string
          score?: number
          passed?: boolean
          answers?: Json
          completed_at?: string
        }
        Relationships: []
      }
      employee_manager_observations: {
        Row: {
          id: string
          business_id: string
          employee_id: string
          observed_by: string
          observation_type: ManagerObservationType
          notes: string
          observed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          employee_id: string
          observed_by: string
          observation_type: ManagerObservationType
          notes: string
          observed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          employee_id?: string
          observed_by?: string
          observation_type?: ManagerObservationType
          notes?: string
          observed_at?: string
          created_at?: string
        }
        Relationships: []
      }
      employee_module_certifications: {
        Row: {
          id: string
          business_id: string
          employee_id: string
          training_module_id: string
          module_completed_at: string | null
          quizzes_passed_at: string | null
          proof_uploaded_at: string | null
          manager_signed_off_at: string | null
          manager_signed_off_by: string | null
          certified_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          employee_id: string
          training_module_id: string
          module_completed_at?: string | null
          quizzes_passed_at?: string | null
          proof_uploaded_at?: string | null
          manager_signed_off_at?: string | null
          manager_signed_off_by?: string | null
          certified_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          employee_id?: string
          training_module_id?: string
          module_completed_at?: string | null
          quizzes_passed_at?: string | null
          proof_uploaded_at?: string | null
          manager_signed_off_at?: string | null
          manager_signed_off_by?: string | null
          certified_at?: string | null
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
          open_alone_override: DelegationReadinessStatus | null
          close_alone_override: DelegationReadinessStatus | null
          train_others_override: DelegationReadinessStatus | null
          handle_complaints_override: DelegationReadinessStatus | null
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
          open_alone_override?: DelegationReadinessStatus | null
          close_alone_override?: DelegationReadinessStatus | null
          train_others_override?: DelegationReadinessStatus | null
          handle_complaints_override?: DelegationReadinessStatus | null
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
          open_alone_override?: DelegationReadinessStatus | null
          close_alone_override?: DelegationReadinessStatus | null
          train_others_override?: DelegationReadinessStatus | null
          handle_complaints_override?: DelegationReadinessStatus | null
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
      scan_reports: {
        Row: {
          id: string
          public_id: string
          created_at: string
          user_id: string | null
          scan_lead_id: string | null
          recipient_email: string
          first_name: string
          report_payload: Record<string, unknown>
          email_status: string
          email_provider: string | null
          email_provider_id: string | null
          delivery_log: Record<string, unknown>[]
          retry_count: number
          last_send_attempt_at: string | null
          sent_at: string | null
        }
        Insert: {
          id?: string
          public_id?: string
          created_at?: string
          user_id?: string | null
          scan_lead_id?: string | null
          recipient_email: string
          first_name?: string
          report_payload: Record<string, unknown>
          email_status?: string
          email_provider?: string | null
          email_provider_id?: string | null
          delivery_log?: Record<string, unknown>[]
          retry_count?: number
          last_send_attempt_at?: string | null
          sent_at?: string | null
        }
        Update: {
          id?: string
          public_id?: string
          created_at?: string
          user_id?: string | null
          scan_lead_id?: string | null
          recipient_email?: string
          first_name?: string
          report_payload?: Record<string, unknown>
          email_status?: string
          email_provider?: string | null
          email_provider_id?: string | null
          delivery_log?: Record<string, unknown>[]
          retry_count?: number
          last_send_attempt_at?: string | null
          sent_at?: string | null
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
      provision_business_workspace: {
        Args: { p_name: string; p_industry?: string; p_display_name?: string }
        Returns: string
      }
      resolve_training_invite: {
        Args: { p_token: string }
        Returns: Json
      }
      resolve_workspace_invite: {
        Args: { p_token: string }
        Returns: Json
      }
    }
    Enums: {
      standard_status: StandardStatus
      business_member_role: BusinessMemberRole
      workspace_invite_status: WorkspaceInviteStatus
      ask_rivet_review_status: AskRivetReviewStatus
      training_progress_status: TrainingProgressStatus
      training_invite_channel: TrainingInviteChannel
      daily_checklist_type: DailyChecklistType
      daily_run_status: DailyRunStatus
      issue_status: IssueStatus
      issue_link_kind: IssueLinkKind
      issue_lifecycle_stage: IssueLifecycleStage
      owner_interruption_kind: OwnerInterruptionKind
      owner_interruption_urgency: OwnerInterruptionUrgency
      owner_interruption_source: OwnerInterruptionSource
      interruption_action_plan_status: InterruptionActionPlanStatus
      interruption_action_fix_type: InterruptionActionFixType
      readiness_badge: ReadinessBadge
      delegation_readiness_status: DelegationReadinessStatus
      manager_observation_type: ManagerObservationType
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
