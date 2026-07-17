import type { ConfidenceTier, ExplainerInput } from './types';

export function resolveConfidenceTier(confidence: number): ConfidenceTier {
  if (confidence >= 0.85) return 'very_high';
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

export function buildConfidenceExplanation(
  input: ExplainerInput,
  locale: import('./types').ExplainerLocale
): import('./types').ConfidenceExplanation {
  const tier = resolveConfidenceTier(input.confidence);
  const block = locale.confidence[tier];
  return {
    tier,
    headline: block.headline,
    text: block.text,
  };
}
