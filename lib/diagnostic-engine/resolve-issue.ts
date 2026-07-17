import { getIssueById, KNOWLEDGE_BASE } from './knowledge-base';
import type { DiagnosticIssue } from './types';

const ANALYSIS_RESULT_FALLBACK: Record<string, string> = {
  normal_engine: 'normal_engine',
  suspicious_noise: 'idle_instability',
  anomaly_detected: 'engine_knocking',
};

/**
 * Résout une panne KB à partir du résultat d'analyse existant (params route / diagnostic DB).
 */
export function resolveIssueFromAnalysis(
  analysisResult: string,
  issueType?: string | null
): DiagnosticIssue {
  if (issueType) {
    const byType = getIssueById(issueType);
    if (byType) return byType;
  }

  const fallbackId = ANALYSIS_RESULT_FALLBACK[analysisResult];
  if (fallbackId) {
    const fallback = getIssueById(fallbackId);
    if (fallback) return fallback;
  }

  return getIssueById('normal_engine') ?? KNOWLEDGE_BASE[KNOWLEDGE_BASE.length - 1];
}
