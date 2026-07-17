import type { DrivingAdviceLevel, ExplainerInput } from './types';

export function resolveDrivingLevel(input: ExplainerInput): DrivingAdviceLevel {
  if (input.isNormal) return 'normal';
  if (!input.peutContinuerARouler) return 'stop_use';
  if (input.niveauUrgence === 'critical' || input.niveauUrgence === 'high') {
    return 'avoid_prolonged';
  }
  if (input.niveauUrgence === 'medium') return 'short_trips';
  return 'normal';
}

export function buildDrivingRecommendation(
  input: ExplainerInput,
  locale: import('./types').ExplainerLocale
): import('./types').DrivingRecommendation {
  const level = resolveDrivingLevel(input);
  const block = locale.driving[level];
  return {
    level,
    headline: block.headline,
    detail: block.detail,
  };
}
