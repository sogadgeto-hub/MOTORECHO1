export function sanitizeNumber(value: number, fallback = 0): number {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }
  return value;
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(sanitizeNumber(score, 0))));
}

export function sanitizeDurationMs(durationMs: number): number {
  return Math.max(0, Math.round(sanitizeNumber(durationMs, 0)));
}

export function sanitizeNormalized(value: number): number {
  return Math.max(0, Math.min(1, sanitizeNumber(value, 0)));
}
