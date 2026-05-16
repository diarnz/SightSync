import type { AnalysisResponse, ChatResponse } from '../types';

declare global {
  interface Window {
    __SIGHTSYNC_CONFIG__?: {
      apiBaseUrl?: string;
    };
  }
}

const API_BASE_URL = window.__SIGHTSYNC_CONFIG__?.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || '/api';

async function parseApiError(response: Response): Promise<Error> {
  const fallback = `Server error: ${response.status}`;
  try {
    const body = await response.json();
    return new Error(body.detail || fallback);
  } catch {
    return new Error(fallback);
  }
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export async function analyzeImage(file: Blob): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file, 'capture.jpg');

  const response = await fetch(`${API_BASE_URL}/analyze-image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.json();
}

export async function chatAboutScene(
  question: string,
  frameDataUrls: string[],
): Promise<ChatResponse> {
  const formData = new FormData();
  formData.append('question', question);

  for (let index = 0; index < frameDataUrls.length; index += 1) {
    const blob = await dataUrlToBlob(frameDataUrls[index]);
    formData.append('files', blob, `scene_${index}.jpg`);
  }

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.json();
}
