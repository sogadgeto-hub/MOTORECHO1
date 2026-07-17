import { interpolate } from './templates';
import type { ExplainerInput } from './types';

function hasRepairCostData(input: ExplainerInput): boolean {
  return (
    typeof input.coutMoyenMin === 'number' &&
    typeof input.coutMoyenMax === 'number' &&
    input.coutMoyenMin > 0 &&
    input.coutMoyenMax > 0 &&
    input.coutMoyenMax >= input.coutMoyenMin
  );
}

function formatRepairHours(hours: number): string {
  if (hours <= 2) return '2';
  if (hours <= 5) return '5';
  return String(hours);
}

export function buildRepairEstimateExplanation(
  input: ExplainerInput,
  locale: import('./types').ExplainerLocale
): import('./types').RepairEstimateExplanation {
  const hasEstimate = !input.isNormal && hasRepairCostData(input);

  if (!hasEstimate) {
    return {
      hasEstimate: false,
      costText: null,
      timeText: null,
      fallbackText: locale.repair.unknownCost,
      disclaimer: null,
    };
  }

  const costText = interpolate(locale.repair.costRange, {
    min: input.coutMoyenMin!,
    max: input.coutMoyenMax!,
  });

  const timeText =
    typeof input.tempsReparationMoyenHeures === 'number' && input.tempsReparationMoyenHeures > 0
      ? interpolate(locale.repair.timeEstimate, {
          hours: formatRepairHours(input.tempsReparationMoyenHeures),
        })
      : null;

  return {
    hasEstimate: true,
    costText,
    timeText,
    fallbackText: locale.repair.unknownCost,
    disclaimer: locale.repair.disclaimer,
  };
}
