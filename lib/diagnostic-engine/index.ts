export type {
  DiagnosticIssue,
  IssueCategory,
  UrgencyLevel,
} from './types';

export {
  KNOWLEDGE_BASE,
  getIssueById,
  getAllIssues,
} from './knowledge-base';

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
} from './access-levels';

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
} from './access-levels';

export { resolveIssueFromAnalysis } from './resolve-issue';
