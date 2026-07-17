import { pickLocalizedString } from './templates';
import type { ExplainerInput } from './types';

const RISK_ITEM_KEYS_BY_ISSUE: Record<string, string[]> = {
  turbo_issue: ['powerLoss', 'overconsumption', 'progressiveWear', 'breakdown'],
  engine_knocking: ['powerLoss', 'progressiveWear', 'engineDamage', 'breakdown'],
  timing_chain_noise: ['progressiveWear', 'engineDamage', 'breakdown', 'costlyRepair'],
  injector_noise: ['overconsumption', 'roughRunning', 'emissions', 'progressiveWear'],
  idle_instability: ['roughRunning', 'overconsumption', 'progressiveWear', 'comfort'],
};

const RISK_ITEM_KEYS_BY_CATEGORY: Record<string, string[]> = {
  turbo: ['powerLoss', 'overconsumption', 'progressiveWear', 'breakdown'],
  engine: ['powerLoss', 'progressiveWear', 'engineDamage', 'breakdown'],
  injection: ['overconsumption', 'roughRunning', 'emissions', 'progressiveWear'],
  distribution: ['engineDamage', 'breakdown', 'costlyRepair', 'progressiveWear'],
  belt: ['breakdown', 'progressiveWear', 'costlyRepair', 'comfort'],
};

export function buildRiskExplanation(
  input: ExplainerInput,
  locale: import('./types').ExplainerLocale
): import('./types').RiskExplanation {
  if (input.isNormal) {
    return { intro: locale.risksIntro, items: [] };
  }

  const keys =
    RISK_ITEM_KEYS_BY_ISSUE[input.issueId] ??
    RISK_ITEM_KEYS_BY_CATEGORY[input.category] ??
    ['powerLoss', 'progressiveWear', 'breakdown'];

  const items = keys
    .map((key) => locale.riskItems[key])
    .filter((item): item is string => Boolean(item));

  return {
    intro: locale.risksIntro,
    items,
  };
}

export function buildGarageRecommendation(
  input: ExplainerInput,
  locale: import('./types').ExplainerLocale
): import('./types').GarageRecommendation {
  if (input.isNormal) {
    return {
      recommendation: locale.garageFallback,
      footnote: locale.garageFootnote,
    };
  }

  const recommendation = pickLocalizedString(
    locale.garageByIssue,
    input.issueId,
    pickLocalizedString(locale.garageByCategory, input.category, locale.garageFallback)
  );

  return {
    recommendation,
    footnote: locale.garageFootnote,
  };
}
