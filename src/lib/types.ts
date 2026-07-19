// TypeScript Data Models for Schmidt Construction Estimating System
// Location: src/lib/types.ts

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  created_at: string;
}

// Phase 3: multiple contacts per client
export interface ClientContact {
  id: string;
  client_id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  is_primary: boolean;
  receives_proposals: boolean;
  notes: string;
  created_at: string;
}

export type ProjectType =
  | 'retaining wall'
  | 'concrete'
  | 'drainage'
  | 'kitchen remodel'
  | 'bathroom remodel'
  | 'commercial'
  | 'other';

export type ProjectStatus = 'Planning' | 'Active' | 'Completed' | 'Cancelled';

export interface Project {
  id: string;
  client_id: string;
  name: string;
  type: ProjectType;
  job_site_address: string;
  description: string;
  desired_start_date: string;
  status: ProjectStatus;
  created_at: string;
}

export type ProposalStatus =
  | 'Draft'
  | 'Sent'
  | 'Viewed'
  | 'Revised'
  | 'Accepted'
  | 'Rejected'
  | 'Expired';

export interface Proposal {
  id: string;
  project_id: string;
  proposal_number: string;
  current_version_id: string | null;
  status: ProposalStatus;
  share_token: string;
  expiration_date: string;
  created_by?: string;
  created_at: string;
}

export interface ProposalVersion {
  id: string;
  proposal_id: string;
  version_number: number;
  title: string;
  scope_of_work: string;
  assumptions: string;
  exclusions: string;
  timeline: string;
  payment_terms: string;
  warranty_notes: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  internal_notes: string;
  client_message: string;
  created_at: string;
  // Phase 4 additions
  remarks?: string;
  deposit_percentage?: number;
  deposit_amount?: number;
  balance_due_text?: string;
  acceptance_language?: string;
  // Phase 5 additions
  wall_sections?: WallSection[];
}

// ============================================================
// PHASE 5: WALL DIMENSIONS & SAVED OPTIONS
// ============================================================

export interface WallSection {
  id: string;
  label: string;
  length_ft: number;
  height_ft: number;
  area_sf: number;
  notes?: string;
  include_in_total: boolean;
}

export interface SavedProposalOption {
  id: string;
  name: string;
  description?: string;
  category?: string;
  default_price: number;
  default_unit: string;
  default_quantity: number;
  default_markup_percent: number;
  line_item_type: LineItemType;
  client_selectable: boolean;
  selected_by_default: boolean;
  created_at: string;
  updated_at: string;
}

export type LineItemType = 'required' | 'optional' | 'phase' | 'alternate';

export interface ProposalLineItem {
  id: string;
  proposal_version_id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  markup_percent: number;
  line_total: number;
  optional: boolean;
  // Phase 4 additions
  line_item_type?: LineItemType;
  client_selectable?: boolean;
  selected_by_default?: boolean;
  sort_order?: number;
}

export type SenderType = 'owner' | 'client' | 'system';

export interface NegotiationEvent {
  id: string;
  proposal_id: string;
  proposal_version_id: string | null;
  sender_type: SenderType;
  message: string;
  requested_changes: string;
  created_at: string;
}

export type UserRole = 'admin' | 'estimator' | 'client';
export interface UserSession {
  role: UserRole;
  name: string;
  email?: string;
}

export interface AuditLog {
  id: string;
  proposal_id: string;
  user_id: string | null;
  action: string;
  details: string;
  created_at: string;
}

// ============================================================
// PHASE 3: CATALOG SYSTEM
// ============================================================

export type CatalogItemType = 'material' | 'labor' | 'equipment' | 'assembly' | 'snippet' | 'template';

export interface CatalogCategory {
  id: string;
  parent_id: string | null;
  name: string;
  type: CatalogItemType;
  sort_order: number;
  created_at: string;
}

export interface CatalogItem {
  id: string;
  category_id: string | null;
  type: CatalogItemType;
  name: string;
  description: string;
  search_tags: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
  // Joined detail (populated on fetch)
  material?: MaterialDetail;
  labor?: LaborDetail;
  equipment?: EquipmentDetail;
  assembly?: AssemblyDetail;
  snippet?: SnippetDetail;
  category?: CatalogCategory;
}

export interface MaterialDetail {
  id: string;
  catalog_item_id: string;
  unit: string;
  unit_cost: number;
  default_markup: number;
  taxable: boolean;
  supplier_id: string | null;
  last_price_date: string | null;
}

export interface LaborDetail {
  id: string;
  catalog_item_id: string;
  skill_type: string;
  rate_per_hour: number;
  burden_rate: number;
  default_markup: number;
}

export interface EquipmentDetail {
  id: string;
  catalog_item_id: string;
  rate_type: 'hourly' | 'daily' | 'weekly';
  hourly_rate: number | null;
  daily_rate: number | null;
  weekly_rate: number | null;
  default_markup: number;
}

export interface AssemblyDetail {
  id: string;
  catalog_item_id: string;
  notes: string;
  components: AssemblyComponent[];
}

export interface AssemblyComponent {
  id: string;
  assembly_id: string;
  component_id: string;
  quantity: number;
  quantity_unit: string;
  quantity_formula: string | null;
  sort_order: number;
  // Joined
  component?: CatalogItem;
}

export interface SnippetDetail {
  id: string;
  catalog_item_id: string;
  content: string;
  insert_target: 'scope_of_work' | 'assumptions' | 'exclusions' | 'payment_terms' | 'warranty_notes';
}

export interface Supplier {
  id: string;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  account_num: string;
  notes: string;
  created_at: string;
}

// ============================================================
// PHASE 3: MEASUREMENT CALCULATORS
// ============================================================

export type MeasurementJobType = 'retaining_wall' | 'concrete_slab' | 'french_drain' | 'bathroom_remodel' | 'kitchen_remodel';

export interface MeasurementInput {
  key: string;
  label: string;
  unit: string;
  type: 'number' | 'select';
  options?: { label: string; value: number }[];
  default?: number;
}

export interface MeasurementResult {
  catalogItemName: string;
  quantity: number;
  unit: string;
  description: string;
  category: string;
}

export interface MeasurementTemplate {
  jobType: MeasurementJobType;
  name: string;
  icon: string;
  inputs: MeasurementInput[];
  calculate: (inputs: Record<string, number>) => MeasurementResult[];
}

// Result of inserting from catalog picker into the proposal editor
export interface CatalogInsertResult {
  type: 'line_items' | 'snippet';
  // For line_items (materials, labor, equipment, assemblies)
  lineItems?: Omit<ProposalLineItem, 'id' | 'proposal_version_id' | 'optional'>[];
  // For snippets
  snippetContent?: string;
  snippetTarget?: SnippetDetail['insert_target'];
}

// ============================================================
// TIME CLOCK & CONTRACTOR EARNINGS MODULE
// ============================================================

export interface ContractorSettings {
  user_id: string;
  contractor_name: string;
  company_name: string;
  manager_name: string;
  manager_email: string;
  hourly_rate_cents: number;
  time_zone: string;
  additional_rate_enabled: boolean;
  additional_rate_threshold_minutes: number;
  additional_rate_multiplier: number;
  auto_clock_out_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type TimeEntryStatus = 'open' | 'closed' | 'voided';

export interface TimeEntry {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  project: string | null;
  customer_name: string | null;
  job_site_address: string | null;
  work_category: string | null;
  notes: string | null;
  status: TimeEntryStatus;
  auto_clock_out: boolean;
  needs_review: boolean;
  review_reason: string | null;
  manual_entry: boolean;
  voided_at: string | null;
  void_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  breaks?: TimeEntryBreak[];
}

export interface TimeEntryBreak {
  id: string;
  time_entry_id: string;
  start_time: string;
  end_time: string | null;
  created_at: string;
  updated_at: string;
}

export type TimesheetStatus = 'open' | 'submitted' | 'amended';

export interface TimesheetPeriod {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  status: TimesheetStatus;
  created_at: string;
  updated_at: string;
}

export interface TimesheetSubmission {
  id: string;
  timesheet_period_id: string;
  user_id: string;
  version: number;
  period_start: string;
  period_end: string;
  contractor_settings_snapshot: any;
  entries_snapshot: any;
  totals_snapshot: any;
  submission_reason: string | null;
  submitted_at: string;
  email_status: string | null;
  email_message_id: string | null;
  created_at: string;
}

export interface TimeEntryAudit {
  id: string;
  time_entry_id: string;
  user_id: string;
  event_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  metadata: any | null;
  created_at: string;
}
