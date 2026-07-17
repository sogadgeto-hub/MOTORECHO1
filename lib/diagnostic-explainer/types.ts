import type { IssueCategory, UrgencyLevel } from '@/lib/diagnostic-engine';

export type ConfidenceTier = 'very_high' | 'high' | 'medium' | 'low';

export type DrivingAdviceLevel = 'normal' | 'short_trips' | 'avoid_prolonged' | 'stop_use';

export type ExplainerUrgencyLevel = 'very_low' | 'low' | 'medium' | 'high' | 'critical';

export type ExplainerInput = {
  issueId: string;
  issueName: string;
  category: IssueCategory;
  analysisResult: string;
  confidence: number;
  niveauUrgence: UrgencyLevel;
  niveauGravite: number;
  peutContinuerARouler: boolean;
  isNormal: boolean;
  coutMoyenMin?: number;
  coutMoyenMax?: number;
  tempsReparationMoyenHeures?: number;
};

export type DiagnosisExplanation = {
  paragraphs: string[];
};

export type ConfidenceExplanation = {
  tier: ConfidenceTier;
  headline: string;
  text: string;
};

export type DrivingRecommendation = {
  level: DrivingAdviceLevel;
  headline: string;
  detail: string;
};

export type UrgencyExplanation = {
  level: ExplainerUrgencyLevel;
  label: string;
  text: string;
};

export type RiskExplanation = {
  intro: string;
  items: string[];
};

export type GarageRecommendation = {
  recommendation: string;
  footnote: string;
};

export type RepairEstimateExplanation = {
  hasEstimate: boolean;
  costText: string | null;
  timeText: string | null;
  fallbackText: string;
  disclaimer: string | null;
};

export type ResolvedDiagnosisExplanation = {
  diagnosis: DiagnosisExplanation;
  confidence: ConfidenceExplanation;
  driving: DrivingRecommendation;
  urgency: UrgencyExplanation;
  risks: RiskExplanation;
  garage: GarageRecommendation;
  repair: RepairEstimateExplanation;
};

/** Shape attendue depuis les fichiers de langue (t.explainer). */
export type ExplainerLocale = {
  sections: {
    diagnosis: string;
    confidence: string;
    driving: string;
    urgency: string;
    risks: string;
    garage: string;
    repair: string;
  };
  confidence: Record<ConfidenceTier, { headline: string; text: string }>;
  driving: Record<DrivingAdviceLevel, { headline: string; detail: string }>;
  urgency: Record<ExplainerUrgencyLevel, { label: string; text: string }>;
  diagnosisNormal: { lead: string; followUp: string };
  diagnosisByIssue: Record<string, { lead: string; followUp: string }>;
  diagnosisByCategory: Record<string, { lead: string; followUp: string }>;
  diagnosisFallback: { lead: string; followUp: string };
  risksIntro: string;
  riskItems: Record<string, string>;
  garageByIssue: Record<string, string>;
  garageByCategory: Record<string, string>;
  garageFallback: string;
  garageFootnote: string;
  repair: {
    costRange: string;
    timeEstimate: string;
    unknownCost: string;
    disclaimer: string;
  };
};
