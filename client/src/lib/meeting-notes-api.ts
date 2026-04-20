import { useAuthContext } from '@/contexts/AuthContext';

export interface NoteSummary {
  id: number;
  title: string;
  createdAt: string;
  durationSeconds: number | null;
  preview: string;
  imageCount: number;
  hasAudio: boolean;
}

export interface NoteImage {
  id: number;
  mimeType: string;
  caption: string | null;
  sortOrder: number;
}

export interface TtsPlayCost {
  totalUsd: number;
  translationUsd: number;
  ttsUsd: number;
  translationModel: string | null;
  ttsProvider: string | null;
  inputTokens: number;
  outputTokens: number;
  ttsChars: number;
}

export interface TtsPlay {
  id: number;
  langCode: string;
  langLabel: string;
  cost: TtsPlayCost;
  createdAt: string;
}

export interface NotePrompt {
  id: number;
  prompt: string;
  response: string;
  modelUsed: string | null;
  createdAt: string;
  ttsPlays: TtsPlay[];
}

export interface NoteDetail {
  id: number;
  title: string;
  transcript: string;
  hasAudio: boolean;
  durationSeconds: number | null;
  sttProvider: string | null;
  createdAt: string;
  images: NoteImage[];
  prompts: NotePrompt[];
}

export function useMeetingNotesApi() {
  const { token } = useAuthContext();

  const authHeader = (): Record<string, string> =>
    token ? { Authorization: `Bearer ${token}` } : {};

  return {
    token,
    authHeader,

    async list(): Promise<NoteSummary[]> {
      const r = await fetch('/api/meeting-notes', { headers: authHeader() });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'Failed');
      return data.notes;
    },

    async get(id: number): Promise<NoteDetail> {
      const r = await fetch(`/api/meeting-notes/${id}`, { headers: authHeader() });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'Failed');
      return data.note;
    },

    async create(params: {
      title: string;
      transcript: string;
      sttProvider: string;
      durationSeconds: number | null;
      audio: Blob | null;
      images: Blob[];
    }): Promise<{ id: number }> {
      const fd = new FormData();
      fd.append('title', params.title);
      fd.append('transcript', params.transcript);
      fd.append('sttProvider', params.sttProvider);
      if (params.durationSeconds != null) fd.append('durationSeconds', String(params.durationSeconds));
      if (params.audio) fd.append('audio', params.audio, 'audio.webm');
      params.images.forEach((img, i) => fd.append('images', img, `image-${i}.jpg`));

      const r = await fetch('/api/meeting-notes', {
        method: 'POST',
        headers: authHeader(),
        body: fd,
      });
      const ct = r.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        if (r.status === 413) {
          throw new Error(`Upload too large (${r.status}). Remove some images or split this meeting.`);
        }
        throw new Error(`Server returned a non-JSON response (${r.status}). The upload may be too large or the server is down.`);
      }
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'Failed');
      return { id: data.note.id };
    },

    async recordTtsPlay(
      promptId: number,
      play: {
        langCode: string;
        langLabel: string;
        costTotalUsd: number;
        costTranslationUsd: number;
        costTtsUsd: number;
        translationModel: string | null;
        ttsProvider: string | null;
        inputTokens: number;
        outputTokens: number;
        ttsChars: number;
      },
    ): Promise<{ id: number; createdAt: string }> {
      const r = await fetch(`/api/meeting-note-prompts/${promptId}/tts-plays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(play),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'Failed to save play');
      return { id: data.id, createdAt: data.createdAt };
    },

    async clearTtsPlays(promptId: number): Promise<void> {
      const r = await fetch(`/api/meeting-note-prompts/${promptId}/tts-plays`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'Failed');
    },

    async update(id: number, patch: { title?: string; transcript?: string }): Promise<void> {
      const r = await fetch(`/api/meeting-notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(patch),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'Failed');
    },

    async remove(id: number): Promise<void> {
      const r = await fetch(`/api/meeting-notes/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'Failed');
    },

    async transcribeViaServer(audio: Blob, languageCode: string): Promise<{ transcript: string; provider: string }> {
      const fd = new FormData();
      fd.append('audio', audio, 'recording.webm');
      fd.append('languageCode', languageCode);
      const r = await fetch('/api/meeting-notes/transcribe', {
        method: 'POST',
        headers: authHeader(),
        body: fd,
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'STT failed');
      return { transcript: data.transcript, provider: data.provider };
    },

    async fetchBlobUrl(path: string): Promise<string> {
      const r = await fetch(path, { headers: authHeader() });
      if (!r.ok) throw new Error('Fetch failed');
      const blob = await r.blob();
      return URL.createObjectURL(blob);
    },
  };
}

import { useEffect, useState } from 'react';

export function useBlobUrl(path: string | null): string | null {
  const { token } = useAuthContext();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path || !token) {
      setUrl(null);
      return;
    }
    let active = true;
    let createdUrl: string | null = null;
    fetch(path, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (!active || !blob) return;
        createdUrl = URL.createObjectURL(blob);
        setUrl(createdUrl);
      })
      .catch(() => {});
    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [path, token]);

  return url;
}
