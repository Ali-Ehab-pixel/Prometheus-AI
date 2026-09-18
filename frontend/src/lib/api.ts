import axios from "axios";
import {
  ActionRequest,
  ActionResponse,
  StreamProgressEvent,
  AuthResponse,
  HealthStatus,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfilePayload,
  UploadResponse,
  User,
  DatasetProfileData,
  HealthScoreBreakdown,
  Recommendation,
  DatasetVersion,
  CopilotChatRequest,
  CopilotChatResponse,
  ReportGenerateRequest,
  ReportGenerateResponse,
  PredictWhatIfRequest,
  PredictWhatIfResponse,
  AnalysisHistoryResponse,
  OTPLoginResponse,
  OTPVerifyRequest,
  ContactTicket,
  SubscriptionStatus,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach bearer token if present in sessionStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("datamorph_auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ==================== Auth API ====================

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/api/auth/login", credentials);
  return res.data;
}

export async function verifyOTP(data: OTPVerifyRequest): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/api/auth/verify-otp", data);
  return res.data;
}

export async function resendOTP(credentials: LoginCredentials): Promise<{ success: boolean; message: string }> {
  const res = await api.post("/api/auth/resend-otp", credentials);
  return res.data;
}

export async function registerUser(credentials: RegisterCredentials): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/api/auth/register", credentials);
  return res.data;
}

export async function getProfile(): Promise<User> {
  const res = await api.get<User>("/api/auth/me");
  return res.data;
}

export async function updateUserProfile(payload: UpdateProfilePayload): Promise<User> {
  const res = await api.put<User>("/api/auth/me", payload);
  return res.data;
}

export async function logoutUserApi(): Promise<{ success: boolean }> {
  try {
    const res = await api.post<{ success: boolean }>("/api/auth/logout");
    return res.data;
  } catch {
    return { success: true };
  }
}

// ==================== Health & Data API ====================

export async function checkBackendHealth(): Promise<HealthStatus> {
  const res = await api.get<HealthStatus>("/api/health");
  return res.data;
}

export async function uploadDatasetFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post<UploadResponse>("/api/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export async function triggerDataAction(payload: ActionRequest): Promise<ActionResponse> {
  const res = await api.post<ActionResponse>("/api/action", payload);
  return res.data;
}

export async function triggerDataActionStream(
  payload: ActionRequest,
  onProgress: (event: StreamProgressEvent) => void,
  onComplete: (response: ActionResponse) => void,
  onError: (error: string) => void,
): Promise<void> {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("datamorph_auth_token") : null;

  try {
    const response = await fetch(`${API_BASE}/api/action/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      onError(errorData.detail || `HTTP ${response.status}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError("Streaming not supported by browser.");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEventType = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEventType = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          const dataStr = line.slice(6);
          try {
            const parsed = JSON.parse(dataStr);
            if (currentEventType === "progress") {
              onProgress(parsed as StreamProgressEvent);
            } else if (currentEventType === "complete") {
              onComplete(parsed as ActionResponse);
            }
          } catch (e) {
            console.warn("Failed to parse SSE data:", dataStr);
          }
          currentEventType = "";
        }
      }
    }
  } catch (err: any) {
    onError(err.message || "Stream connection failed.");
  }
}

export function getArtifactDownloadUrl(downloadPath?: string): string {
  if (!downloadPath) return "#";
  if (downloadPath.startsWith("http")) return downloadPath;
  return `${API_BASE}${downloadPath}`;
}

export async function getDatasetProfile(fileId: string): Promise<{
  profile: DatasetProfileData;
  health_score: HealthScoreBreakdown;
  recommendations: Recommendation[];
}> {
  const res = await api.get(`/api/datasets/${fileId}/profile`);
  return res.data;
}

export async function getDatasetVersions(fileId: string): Promise<{ versions: DatasetVersion[] }> {
  const res = await api.get(`/api/datasets/${fileId}/versions`);
  return res.data;
}

export async function restoreDatasetVersion(fileId: string, versionId: string): Promise<{ success: boolean; message: string }> {
  const res = await api.post(`/api/datasets/${fileId}/versions/${versionId}/restore`);
  return res.data;
}

export async function sendCopilotMessage(req: CopilotChatRequest): Promise<CopilotChatResponse> {
  const res = await api.post<CopilotChatResponse>("/api/copilot/chat", req);
  return res.data;
}

export async function generateDatasetReport(fileId: string, req: ReportGenerateRequest): Promise<ReportGenerateResponse> {
  const res = await api.post<ReportGenerateResponse>(`/api/datasets/${fileId}/report`, req);
  return res.data;
}

export async function runPredictWhatIf(fileId: string, req: PredictWhatIfRequest): Promise<PredictWhatIfResponse> {
  const res = await api.post<PredictWhatIfResponse>(`/api/models/${fileId}/predict`, req);
  return res.data;
}

export async function getAnalysisHistory(fileId?: string): Promise<AnalysisHistoryResponse> {
  const url = fileId ? `/api/analyses/history?file_id=${fileId}` : "/api/analyses/history";
  const res = await api.get<AnalysisHistoryResponse>(url);
  return res.data;
}

// ==================== Contact / Support API ====================

export async function submitContactTicket(data: {
  subject: string;
  category: string;
  message: string;
  email?: string;
}): Promise<ContactTicket> {
  const res = await api.post<ContactTicket>("/api/contact/submit", data);
  return res.data;
}

export async function getMyTickets(): Promise<{ tickets: ContactTicket[]; total: number }> {
  const res = await api.get("/api/contact/my-tickets");
  return res.data;
}

// ==================== Subscription API ====================

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const res = await api.get<SubscriptionStatus>("/api/subscription/status");
  return res.data;
}

export async function getSubscriptionPlans(): Promise<{ plans: any[] }> {
  const res = await api.get("/api/subscription/plans");
  return res.data;
}

export async function cancelSubscription(): Promise<{ success: boolean; message: string }> {
  const res = await api.post("/api/subscription/cancel");
  return res.data;
}
