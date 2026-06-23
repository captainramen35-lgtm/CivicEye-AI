const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `API error ${res.status}`);
  }
  return res.json();
}

export async function analyzeImage(imageBase64: string) {
  return apiFetch<{
    issue_type: string;
    severity: "low" | "medium" | "high";
    risk_notes: string;
    department: string;
    category: string;
    confidence: number;
  }>("/ai/analyze", {
    method: "POST",
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
}

export async function createIssue(data: Record<string, unknown>) {
  return apiFetch<{ id: string; priority_score: number; status: string }>("/issues/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listIssues(params?: {
  category?: string;
  status?: string;
  lat?: number;
  lng?: number;
  radius_m?: number;
}) {
  const q = new URLSearchParams();
  if (params?.category) q.set("category", params.category);
  if (params?.status) q.set("status", params.status);
  if (params?.lat) q.set("lat", String(params.lat));
  if (params?.lng) q.set("lng", String(params.lng));
  if (params?.radius_m) q.set("radius_m", String(params.radius_m));
  return apiFetch<Record<string, unknown>[]>(`/issues/?${q}`);
}

export async function getIssue(id: string) {
  return apiFetch<Record<string, unknown>>(`/issues/${id}`);
}

export async function submitVerification(data: {
  issue_id: string;
  user_id: string;
  action: "verify" | "reject";
  evidence_url?: string;
}) {
  return apiFetch("/verification/", { method: "POST", body: JSON.stringify(data) });
}

export async function getImpactStats() {
  return apiFetch<Record<string, unknown>>("/analytics/impact");
}

export async function getLeaderboard() {
  return apiFetch<Record<string, unknown>[]>("/gamification/leaderboard");
}

export async function getUserProfile(uid: string) {
  return apiFetch<Record<string, unknown>>(`/gamification/user/${uid}/profile`);
}

export async function getPriorityQueue() {
  return apiFetch<Record<string, unknown>[]>("/priority/queue");
}

export async function updateIssueStatus(data: {
  issue_id: string;
  new_status: string;
  authority_id: string;
  note?: string;
}) {
  return apiFetch(`/issues/${data.issue_id}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getTrends(days = 30) {
  return apiFetch<Record<string, unknown>>(`/analytics/trends?days=${days}`);
}

export async function checkDuplicate(data: {
  lat: number;
  lng: number;
  issue_type: string;
  category: string;
}) {
  return apiFetch<{
    is_duplicate: boolean;
    merged_into?: string;
    existing_issue_id?: string;
    similarity_score?: number;
  }>("/duplicates/check", { method: "POST", body: JSON.stringify(data) });
}
