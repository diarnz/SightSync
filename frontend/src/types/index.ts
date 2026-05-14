// ============================================================
// SightSync – Shared TypeScript Types
// ============================================================

/** Response shape returned by POST /analyze-image */
export interface AnalysisResponse {
  description: string;          // Main accessibility-focused scene description
  confidence: 'high' | 'medium' | 'low';
  tags: string[];               // Key objects / scene labels
  timestamp: string;            // ISO 8601 from backend
  processing_time_ms: number;
}

/** Possible states of the image analysis workflow */
export type AnalysisStatus = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

/** A single entry in the local history log */
export interface HistoryEntry {
  id: string;
  imageDataUrl: string;          // Base64 thumbnail stored in state (not persisted)
  response: AnalysisResponse;
  createdAt: Date;
}

/** Firebase user shape (slim version of firebase/auth User) */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/** Toast notification levels */
export type ToastLevel = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  level: ToastLevel;
}
