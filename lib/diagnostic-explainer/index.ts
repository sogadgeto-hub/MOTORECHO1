import { pickLocalizedBlock, interpolate } from './templates';
import { buildConfidenceExplanation } from './explain';
import { buildDrivingRecommendation } from './driving';
import { buildUrgencyExplanation } from './urgency';
import { buildRiskExplanation, buildGarageRecommendation } from './recommendation';
import { buildRepairEstimateExplanation } from './repair';
import type {
  DiagnosisExplanation,
  ExplainerInput,
  ExplainerLocale,
  ResolvedDiagnosisExplanation,
} from './types';
import type { DiagnosticIssue, PremiumDiagnosticResult, GarageDiagnosticResult } from '@/lib/diagnostic-engine';

export type {
  ConfidenceTier,
  DiagnosisExplanation,
  DrivingRecommendation,
  ExplainerInput,
  ExplainerLocale,
  ExplainerUrgencyLevel,
  GarageRecommendation,
  RepairEstimateExplanation,
  ResolvedDiagnosisExplanation,
  RiskExplanation,
  UrgencyExplanation,
  ConfidenceExplanation,
} from './types';

export { resolveConfidenceTier } from './explain';
export { resolveDrivingLevel } from './driving';
export { resolveExplainerUrgencyLevel } from './urgency';

export function buildExplainerInput(
  issue: DiagnosticIssue,
  data: PremiumDiagnosticResult | GarageDiagnosticResult | null,
  options: {
    analysisResult: string;
    confidence: number;
    isNormal: boolean;
  }
): ExplainerInput {
  return {
    issueId: issue.id,
    issueName: issue.nom,
    category: issue.categorie,
    analysisResult: options.analysisResult,
    confidence: options.confidence,
    niveauUrgence: data?.niveauUrgence ?? issue.niveauUrgence,
    niveauGravite: data?.niveauGravite ?? issue.niveauGravite,
    peutContinuerARouler: data?.peutContinuerARouler ?? issue.peutContinuerARouler,
    isNormal: options.isNormal,
    coutMoyenMin: data?.coutMoyenMin,
    coutMoyenMax: data?.coutMoyenMax,
    tempsReparationMoyenHeures: data?.tempsReparationMoyenHeures,
  };
}

function buildDiagnosisText(input: ExplainerInput, locale: ExplainerLocale): DiagnosisExplanation {
  if (input.isNormal) {
    return {
      paragraphs: [locale.diagnosisNormal.lead, locale.diagnosisNormal.followUp],
    };
  }

  const block = pickLocalizedBlock(
    locale.diagnosisByIssue,
    input.issueId,
    pickLocalizedBlock(locale.diagnosisByCategory, input.category, locale.diagnosisFallback)
  );

  const lead = interpolate(block.lead, {
    issueName: input.issueName,
    confidencePercent: Math.round(input.confidence * 100),
  });

  return {
    paragraphs: [lead, block.followUp],
  };
}

/**
 * Point d'entrée unique — remplaçable par un LLM sans modifier l'UI.
 */
export function buildDiagnosisExplanation(
  input: ExplainerInput,
  locale: ExplainerLocale
): ResolvedDiagnosisExplanation {
  return {
    diagnosis: buildDiagnosisText(input, locale),
    confidence: buildConfidenceExplanation(input, locale),
    driving: buildDrivingRecommendation(input, locale),
    urgency: buildUrgencyExplanation(input, locale),
    risks: buildRiskExplanation(input, locale),
    garage: buildGarageRecommendation(input, locale),
    repair: buildRepairEstimateExplanation(input, locale),
  };
}
