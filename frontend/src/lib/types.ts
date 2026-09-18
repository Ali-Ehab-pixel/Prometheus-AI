export type ActionType = "clean" | "visualize" | "insights";

export type OutputFormat = "csv" | "xlsx" | "html" | "json";

export interface ColumnInfo {
  name: string;
  dtype: string;
  null_count: number;
  unique_count: number;
  sample_values: (string | number | boolean | null)[];
}

export interface DatasetMetadata {
  filename: string;
  file_type: string;
  row_count: number;
  col_count: number;
  columns: ColumnInfo[];
  head_rows: Record<string, any>[];
  summary_stats?: {
    numeric_summary?: Record<string, Record<string, number>>;
  };
  memory_usage_mb: number;
}

export interface UploadResponse {
  success: boolean;
  file_id: string;
  original_filename: string;
  file_path: string;
  metadata: DatasetMetadata;
  message: string;
  profile?: DatasetProfileData;
  health_score?: HealthScoreBreakdown;
  recommendations?: Recommendation[];
}

export interface ActionRequest {
  file_id: string;
  action: ActionType;
  target_column?: string;
  output_format?: OutputFormat;
}

export interface ArtifactInfo {
  filename: string;
  file_type: string;
  mime_type: string;
  size_bytes: number;
  download_url?: string;
  html_content?: string;
}

export interface InsightItem {
  category: "trend" | "correlation" | "anomaly" | "distribution" | "summary";
  title: string;
  description: string;
  metric?: string;
  importance?: "high" | "medium" | "low";
}

export interface InsightsData {
  executive_summary?: string;
  total_rows?: number;
  total_columns?: number;
  key_insights?: InsightItem[];
  top_correlations?: { feature_x: string; feature_y: string; correlation: number }[];
  anomalies_detected?: { column: string; outlier_count: number; description: string }[];
}

export interface ActionResponse {
  success: boolean;
  action: ActionType;
  generated_code: string;
  stdout?: string;
  stderr?: string;
  artifact?: ArtifactInfo;
  artifacts?: ArtifactInfo[];
  execution_time_seconds: number;
  insights_data?: InsightsData;
  version_saved?: string;
  error?: string;
}

export interface StreamProgressEvent {
  stage: "generating_code" | "code_ready" | "executing" | "processing" | "complete";
  message: string;
  cached?: boolean;
}

export interface ModelLeaderboardItem {
  name: string;
  model_name?: string;
  task_type?: string;
  fit_time_seconds?: number;
  accuracy?: number;
  f1_score?: number;
  precision?: number;
  recall?: number;
  rmse?: number;
  mae?: number;
  r2_score?: number;
  primary_metric_value?: number;
  secondary_metric_name?: string;
  secondary_metric_value?: number;
  is_winner?: boolean;
  [key: string]: any;
}

export interface LeaderboardData {
  task_type?: string;
  target_column?: string;
  best_model?: string;
  metric_used?: string;
  primary_metric_name?: string;
  models: ModelLeaderboardItem[];
  [key: string]: any;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
  raw_score: number;
  direction?: string;
}

export interface ExplainabilityData {
  target_column: string;
  method: string;
  summary: string;
  top_features: FeatureImportanceItem[];
}

export interface PredictWhatIfRequest {
  file_id?: string;
  features: Record<string, any>;
  [key: string]: any;
}

export interface PredictWhatIfResponse {
  success: boolean;
  prediction?: any;
  confidence?: number;
  probabilities?: Record<string, number>;
  task_type?: string;
  error?: string;
}

export interface HealthStatus {
  status: string;
  llm_provider: string;
  primary_model: string;
  fallback_model: string;
  e2b_configured: boolean;
  environment: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  country: string;
  job_title: string;
  created_at: string;
  datasets_uploaded: number;
  analyses_performed: number;
  role: string;
  subscription_plan: string;
  subscription_expires_at?: string;
  free_uses_remaining: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  full_name: string;
  email: string;
  password: string;
  phone_number: string;
  country: string;
  job_title: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone_number?: string;
  country?: string;
  job_title?: string;
}

export interface AuthResponse {
  success: boolean;
  access_token: string;
  token_type: string;
  user: User;
  message: string;
  requires_otp?: boolean;
}

export interface OTPLoginResponse {
  success: boolean;
  requires_otp: boolean;
  email: string;
  message: string;
}

export interface OTPVerifyRequest {
  email: string;
  otp_code: string;
}

export interface ContactTicket {
  id: string;
  user_id?: string;
  user_email: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  admin_reply?: string;
  created_at: string;
  updated_at?: string;
}

export interface SubscriptionStatus {
  plan: string;
  status: string;
  expires_at?: string;
  free_uses_remaining: number;
  is_active: boolean;
}

// === Phase 1: Dataset Intelligence Types ===

export interface ColumnProfile {
  name: string;
  dtype: string;
  null_count: number;
  null_percentage: number;
  unique_count: number;
  cardinality_ratio: number;
  sample_values: any[];
  stats?: Record<string, any>;  // min, max, mean, median, std for numerics
  top_values?: { value: any; count: number; percentage: number }[];
  quality_issues: string[];
}

export interface DataQualityIssue {
  issue_type: string;
  column?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggested_fix?: string;
}

export interface HealthScoreBreakdown {
  overall_score: number;
  completeness: number;
  consistency: number;
  uniqueness: number;
  validity: number;
  shape: number;
  grade: string;  // A, B, C, D, F
  issues: DataQualityIssue[];
}

export interface Recommendation {
  action: string;
  title: string;
  reason: string;
  priority: number;
  confidence: number;
}

export interface DatasetVersion {
  version_id: string;
  label: string;
  timestamp: string;
  row_count: number;
  col_count: number;
}

export interface DatasetProfileData {
  columns: ColumnProfile[];
  quality_issues: DataQualityIssue[];
  correlations?: Record<string, Record<string, number>>;
  target_suggestions: string[];
  row_count: number;
  col_count: number;
  memory_usage_mb: number;
  duplicate_row_count: number;
  total_null_count: number;
  total_null_percentage: number;
}

// === Phase 4: Conversational Copilot Types ===

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface CopilotChatRequest {
  file_id: string;
  message: string;
  history?: ChatMessage[];
}

export interface CopilotChatResponse {
  reply: string;
  suggested_actions?: string[];
  suggested_follow_ups?: string[];
}

// === Phase 7 & 8: Reports, What-If, and History Types ===

export interface ReportGenerateRequest {
  file_id: string;
  format: "html" | "xlsx";
  title?: string;
}

export interface ReportGenerateResponse {
  success: boolean;
  format: string;
  filename: string;
  download_url: string;
  message: string;
}

export interface AnalysisHistoryItem {
  id: string;
  file_id: string;
  action: string;
  custom_prompt?: string;
  target_column?: string;
  success: boolean;
  execution_time_seconds: number;
  artifact_filename?: string;
  created_at: string;
}

export interface AnalysisHistoryResponse {
  history: AnalysisHistoryItem[];
}

