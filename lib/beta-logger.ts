export type BetaLogCategory =
  | 'auth'
  | 'microphone_permission'
  | 'recording_start'
  | 'recording_stop'
  | 'audio_interruption'
  | 'analysis'
  | 'supabase_save'
  | 'subscription';

export type BetaLogEntry = {
  timestamp: string;
  category: BetaLogCategory;
  message: string;
  technicalCode?: string;
};

const MAX_ENTRIES = 40;
const entries: BetaLogEntry[] = [];

export function logBetaEvent(
  category: BetaLogCategory,
  message: string,
  technicalCode?: string
): void {
  entries.unshift({
    timestamp: new Date().toISOString(),
    category,
    message: sanitizeMessage(message),
    technicalCode,
  });

  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }
}

export function getBetaLogEntries(): readonly BetaLogEntry[] {
  return entries;
}

export function clearBetaLog(): void {
  entries.length = 0;
}

export function getLastBetaLogEntry(): BetaLogEntry | null {
  return entries[0] ?? null;
}

export function buildTechnicalReport(
  context?: Record<string, string | number | boolean | null> | null
): string {
  const safeContext =
    context != null && typeof context === 'object' && !Array.isArray(context) ? context : {};

  const lines = [
    '=== MotorEcho Beta Technical Report ===',
    `generatedAt: ${new Date().toISOString()}`,
    '',
    '--- Context ---',
    ...Object.entries(safeContext).map(([key, value]) => `${key}: ${String(value ?? 'null')}`),
    '',
    '--- Recent events ---',
  ];

  if (entries.length === 0) {
    lines.push('(no events recorded)');
  } else {
    for (const entry of entries) {
      lines.push(
        `[${entry.timestamp}] ${entry.category}${entry.technicalCode ? ` (${entry.technicalCode})` : ''}: ${entry.message}`
      );
    }
  }

  return lines.join('\n');
}

function sanitizeMessage(message: string): string {
  return message
    .replace(/Bearer\s+\S+/gi, '[REDACTED_TOKEN]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    .slice(0, 500);
}
