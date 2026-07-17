export type {
  UserPlan,
  GeneralStatus,
  SimplifiedSeverity,
  WorkshopPriority,
  FreeDiagnosticResult,
  PremiumDiagnosticResult,
  GarageMechanicNotes,
  GaragePdfReport,
  GarageDiagnosticResult,
  DiagnosticAccessResult,
} from './types';

export {
  buildDiagnosticResult,
  buildFreeResult,
  buildPremiumResultFromIssue,
  buildGarageResult,
  clampConfidence,
  normalizeUserPlan,
  resolveGeneralStatus,
  resolveSimplifiedSeverity,
  resolveGeneralCategoryLabel,
  resolveShortAdvice,
  resolveWorkshopPriority,
  urgencyRank,
} from './build-result';
