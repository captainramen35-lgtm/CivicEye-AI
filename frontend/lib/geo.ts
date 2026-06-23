export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)}m`;
  return `${(metres / 1000).toFixed(1)}km`;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { "User-Agent": "CivicEye-AI/1.0 (civic-reporting-app)" } }
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });
}

export const SEVERITY_COLORS: Record<string, string> = {
  low: "#3E9C6B",
  medium: "#E0A23B",
  high: "#D14545",
};

export const STATUS_LABELS: Record<string, string> = {
  reported: "Reported",
  ai_verified: "AI Verified",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export const CATEGORIES = [
  "Road Damage",
  "Water Leakage",
  "Waste Management",
  "Streetlight Failure",
  "Drainage Issues",
  "Public Safety Concerns",
  "Infrastructure Damage",
];

export const DEPARTMENTS = [
  "Roads Department",
  "Water Board",
  "Sanitation Department",
  "Electricity Board",
  "Public Works Department",
  "Municipal Corporation",
];
