// ============================================================
// SightSync – Shared TypeScript Types
// ============================================================

/** Response shape returned by POST /analyze-image */
export interface AnalysisResponse {
  description: string;          // Main accessibility-focused scene description
  confidence: 'high' | 'medium' | 'low';
  urgency: 'normal' | 'critical';
  should_speak: boolean;
  tags: string[];               // Key objects / scene labels
  timestamp: string;            // ISO 8601 from backend
  processing_time_ms: number;
  audio_base64?: string | null;
}

/** Response shape returned by POST /chat */
export interface ChatResponse {
  answer: string;
  processing_time_ms: number;
  timestamp: string;
  audio_base64?: string | null;
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

/** Toast notification levels */
export type ToastLevel = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  level: ToastLevel;
}
