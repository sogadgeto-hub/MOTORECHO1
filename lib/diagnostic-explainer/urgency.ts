import type { ExplainerInput, ExplainerUrgencyLevel } from './types';

export function resolveExplainerUrgencyLevel(input: ExplainerInput): ExplainerUrgencyLevel {
  if (input.isNormal) return 'very_low';

  switch (input.niveauUrgence) {
    case 'low':
      return input.niveauGravite <= 2 ? 'very_low' : 'low';
    case 'medium':
      return 'medium';
    case 'high':
      return 'high';
    case 'critical':
      return 'critical';
    default:
      return 'low';
  }
}

export function buildUrgencyExplanation(
  input: ExplainerInput,
  locale: import('./types').ExplainerLocale
): import('./types').UrgencyExplanation {
  const level = resolveExplainerUrgencyLevel(input);
  const block = locale.urgency[level];
  return {
    level,
    label: block.label,
    text: block.text,
  };
}
