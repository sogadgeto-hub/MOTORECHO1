export type BetaSessionSnapshot = {
  recordingPhase: string;
  durationMs: number | null;
  qualityScore: number | null;
};

const snapshot: BetaSessionSnapshot = {
  recordingPhase: 'idle',
  durationMs: null,
  qualityScore: null,
};

export function updateBetaSessionSnapshot(partial: Partial<BetaSessionSnapshot>): void {
  Object.assign(snapshot, partial);
}

export function getBetaSessionSnapshot(): Readonly<BetaSessionSnapshot> {
  return snapshot;
}

export function resetBetaSessionSnapshot(): void {
  snapshot.recordingPhase = 'idle';
  snapshot.durationMs = null;
  snapshot.qualityScore = null;
}
