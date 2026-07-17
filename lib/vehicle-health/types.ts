export type HealthLevelId = 'excellent' | 'good' | 'watch' | 'advised' | 'urgent';

export type HealthEvolution = 'improving' | 'stable' | 'declining' | 'unknown';

/** Entrée minimale pour le calcul — indépendante du Diagnostic Engine. */
export type HealthAnalysisInput = {
  id: string;
  result: string;
  issue_type: string | null;
  confidence: number;
  severity: string;
  created_at: string;
};

export type ResolvedHealthLevel = {
  id: HealthLevelId;
  emoji: string;
  color: string;
  min: number;
  max: number;
};

export type VehicleHealthScoreResult = {
  score: number;
  level: ResolvedHealthLevel;
  consecutiveNormalCount: number;
  anomalyCountRecent: number;
};

export type TimelineEntry = {
  id: string;
  createdAt: string;
  score: number;
  level: ResolvedHealthLevel;
  result: string;
  issue_type: string | null;
  isNormal: boolean;
};

export type VehicleHealthStats = {
  totalAnalyses: number;
  firstAnalysisDate: string | null;
  lastAnalysisDate: string | null;
  daysSinceLastAnalysis: number | null;
  mostFrequentAnomaly: string | null;
  mostFrequentAnomalyCount: number;
};

export type HealthEvolutionResult = {
  evolution: HealthEvolution;
  delta: number;
  previousScore: number | null;
  currentScore: number;
};

export type VehicleHealthDashboardData = {
  score: VehicleHealthScoreResult;
  evolution: HealthEvolutionResult;
  timeline: TimelineEntry[];
  stats: VehicleHealthStats;
  showAnalysisReminder: boolean;
};

export type HealthScoreConfig = {
  baseScore: number;
  recentWindowSize: number;
  resultPenalties: Record<string, number>;
  severityPenalties: Record<string, number>;
  perAnomalyCountPenalty: number;
  confidencePenaltyFactor: number;
  lowConfidenceThreshold: number;
  lowConfidenceExtraPenalty: number;
  consecutiveNormalBonus: number;
  maxConsecutiveNormalBonus: number;
  evolutionStableThreshold: number;
};
