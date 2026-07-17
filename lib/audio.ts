import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

import type { RecordingQuality } from './audio-quality';

export const MAX_RECORDING_DURATION_MS = 10_000;

export type AudioFormat = 'm4a' | 'mp4' | 'aac' | 'wav' | 'unknown';

export type ValidatedAudioFile = {
  uri: string;
  size: number;
  format: AudioFormat;
  durationMs: number;
};

export type AudioUploadResult = {
  storagePath: string;
  format: AudioFormat;
  durationMs: number;
  sizeBytes: number;
};

const AUDIO_ERROR_MESSAGES_FR = {
  NOT_FOUND: "Fichier audio introuvable. Veuillez réenregistrer.",
  EMPTY: "L'enregistrement est vide. Veuillez réenregistrer le moteur.",
  TOO_SHORT: "L'enregistrement est trop court. Maintenez l'enregistrement au moins 1 seconde.",
  READ_FAILED: "Impossible de lire le fichier audio enregistré.",
  COPY_FAILED: "Impossible de sauvegarder l'enregistrement localement. Veuillez réenregistrer.",
  SESSION_EXPIRED: "Session audio expirée. Veuillez réenregistrer le moteur.",
  UPLOAD_FAILED: "Échec du téléversement audio. Vérifiez votre connexion et réessayez.",
  NOT_AUTHENTICATED: 'Aucune session authentifiée — veuillez vous reconnecter',
} as const;

export type PendingAudioSession = {
  uri: string;
  durationMs: number;
  userId: string;
  vehicleId: string | null;
  recordingQuality?: RecordingQuality | null;
};

const pendingAudioSessions = new Map<string, PendingAudioSession>();

export function getAudioErrorMessage(code: keyof typeof AUDIO_ERROR_MESSAGES_FR): string {
  return AUDIO_ERROR_MESSAGES_FR[code];
}

export function detectAudioFormat(uri: string): AudioFormat {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'm4a' || ext === 'mp4') return 'm4a';
  if (ext === 'aac') return 'aac';
  if (ext === 'wav') return 'wav';
  return 'unknown';
}

export function getAudioContentType(format: AudioFormat): string {
  switch (format) {
    case 'm4a':
    case 'mp4':
      return 'audio/mp4';
    case 'aac':
      return 'audio/aac';
    case 'wav':
      return 'audio/wav';
    default:
      return 'audio/mp4';
  }
}

export function buildAudioStoragePath(
  userId: string,
  vehicleId: string | null,
  durationMs: number,
  format: AudioFormat
): string {
  const vehicleSegment = vehicleId ?? 'no-vehicle';
  const ext = format === 'unknown' ? 'm4a' : format;
  return `${userId}/${vehicleSegment}/${Date.now()}_${durationMs}ms.${ext}`;
}

export function parseAudioStorageMetadata(storagePath: string | null): {
  durationMs: number | null;
  format: AudioFormat | null;
} {
  if (!storagePath) return { durationMs: null, format: null };
  const filename = storagePath.split('/').pop() ?? '';
  const durationMatch = filename.match(/_(\d+)ms\./);
  const ext = filename.split('.').pop()?.toLowerCase();
  return {
    durationMs: durationMatch ? parseInt(durationMatch[1], 10) : null,
    format: ext ? detectAudioFormat(`file.${ext}`) : null,
  };
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function ensureDirectoryExists(dirUri: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(dirUri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
  }
}

export function buildLocalAudioDirectory(userId: string, vehicleId: string | null): string {
  const vehicleSegment = vehicleId ?? 'no-vehicle';
  return `${FileSystem.documentDirectory}motorecho/audio/${userId}/${vehicleSegment}/`;
}

export function createPendingAudioSession(session: PendingAudioSession): string {
  const id = `audio-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  pendingAudioSessions.set(id, session);
  return id;
}

export function getPendingAudioSession(sessionId: string): PendingAudioSession | null {
  return pendingAudioSessions.get(sessionId) ?? null;
}

export function removePendingAudioSession(sessionId: string): void {
  pendingAudioSessions.delete(sessionId);
}

/**
 * Copy the recorder temp file into documentDirectory so it survives navigation.
 */
export async function persistRecordedAudio(
  sourceUri: string,
  userId: string,
  vehicleId: string | null
): Promise<{ uri: string; size: number }> {
  const sourceInfo = await FileSystem.getInfoAsync(sourceUri);

  if (!sourceInfo.exists) {
    throw new Error(AUDIO_ERROR_MESSAGES_FR.NOT_FOUND);
  }

  const sourceSize = 'size' in sourceInfo && typeof sourceInfo.size === 'number' ? sourceInfo.size : 0;

  if (sourceSize <= 0) {
    throw new Error(AUDIO_ERROR_MESSAGES_FR.EMPTY);
  }

  const dir = buildLocalAudioDirectory(userId, vehicleId);
  await ensureDirectoryExists(dir);

  const destUri = `${dir}${Date.now()}.m4a`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });

  const destInfo = await FileSystem.getInfoAsync(destUri);

  const destSize = 'size' in destInfo && typeof destInfo.size === 'number' ? destInfo.size : 0;

  if (!destInfo.exists || destSize <= 0) {
    throw new Error(AUDIO_ERROR_MESSAGES_FR.COPY_FAILED);
  }

  return { uri: destUri, size: destSize };
}

export async function resolveAudioUriForProcessing(
  sessionId?: string | null,
  encodedUri?: string | null
): Promise<string> {
  if (sessionId) {
    const session = getPendingAudioSession(sessionId);

    if (!session) {
      throw new Error(AUDIO_ERROR_MESSAGES_FR.SESSION_EXPIRED);
    }

    return session.uri;
  }

  if (encodedUri) {
    return decodeURIComponent(encodedUri);
  }

  throw new Error(AUDIO_ERROR_MESSAGES_FR.NOT_FOUND);
}

export async function validateAudioFile(
  uri: string,
  durationMs: number
): Promise<ValidatedAudioFile> {
  const info = await FileSystem.getInfoAsync(uri);

  if (!info.exists) {
    throw new Error(AUDIO_ERROR_MESSAGES_FR.NOT_FOUND);
  }

  const size = 'size' in info && typeof info.size === 'number' ? info.size : 0;

  if (size <= 0) {
    throw new Error(AUDIO_ERROR_MESSAGES_FR.EMPTY);
  }

  if (durationMs < 1000) {
    throw new Error(AUDIO_ERROR_MESSAGES_FR.TOO_SHORT);
  }

  return {
    uri,
    size,
    format: detectAudioFormat(uri),
    durationMs,
  };
}

export async function uploadAudioFile(
  audio: ValidatedAudioFile,
  userId: string,
  vehicleId: string | null
): Promise<AudioUploadResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id || session.user.id !== userId) {
    throw new Error(AUDIO_ERROR_MESSAGES_FR.NOT_AUTHENTICATED);
  }

  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(audio.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    throw new Error(AUDIO_ERROR_MESSAGES_FR.READ_FAILED);
  }

  if (!base64) {
    throw new Error(AUDIO_ERROR_MESSAGES_FR.EMPTY);
  }

  const arrayBuffer = base64ToArrayBuffer(base64);
  if (arrayBuffer.byteLength <= 0) {
    throw new Error(AUDIO_ERROR_MESSAGES_FR.EMPTY);
  }

  const storagePath = buildAudioStoragePath(
    userId,
    vehicleId,
    audio.durationMs,
    audio.format
  );

  const { data, error } = await supabase.storage
    .from('engine-audio')
    .upload(storagePath, arrayBuffer, {
      contentType: getAudioContentType(audio.format),
      upsert: false,
    });

  if (error) {
    throw new Error(`${AUDIO_ERROR_MESSAGES_FR.UPLOAD_FAILED} (${error.message})`);
  }

  return {
    storagePath: data.path,
    format: audio.format,
    durationMs: audio.durationMs,
    sizeBytes: arrayBuffer.byteLength,
  };
}
