import type { DiagnosticIssue, IssueCategory } from '@/lib/diagnostic-engine';
import {
  resolveGeneralStatus,
  type GeneralStatus,
  type PremiumDiagnosticResult,
  type UrgencyLevel,
} from '@/lib/diagnostic-engine';

export type VehicleHealthStatus = GeneralStatus;

export function getVehicleHealthStatus(issue: DiagnosticIssue): VehicleHealthStatus {
  return resolveGeneralStatus(issue);
}

export function getDriveAdvice(
  data: Pick<PremiumDiagnosticResult, 'peutContinuerARouler' | 'niveauUrgence' | 'conseils'>
): { label: 'yes' | 'yes_short' | 'no'; explanation: string } {
  const explanation = data.conseils[0] ?? '';

  if (!data.peutContinuerARouler) {
    return { label: 'no', explanation };
  }

  if (data.niveauUrgence === 'medium' || data.niveauUrgence === 'high') {
    return { label: 'yes_short', explanation };
  }

  return { label: 'yes', explanation };
}

export function getPrimaryMotorEchoAdvice(conseils: string[]): string {
  if (conseils.length === 0) {
    return 'Surveillez l’évolution du bruit et consultez un professionnel si le symptôme persiste.';
  }
  return conseils[0];
}

export function getSecondaryAdvice(conseils: string[]): string[] {
  return conseils.slice(1);
}

export function formatRepairHours(hours: number): string {
  if (hours <= 2) return '2 h';
  if (hours <= 5) return '5 h';
  if (hours <= 8) return `${hours} h`;
  return `${hours} h`;
}

export function urgencyDisplayLevel(urgence: UrgencyLevel): 'low' | 'medium' | 'high' | 'critical' {
  return urgence;
}

const CONSEQUENCES_BY_ISSUE: Record<string, string[]> = {
  turbo_issue: ['Perte de puissance', 'Surconsommation de carburant', 'Risque de casse du turbo'],
  engine_knocking: ['Usure accélérée du moteur', 'Perte de performance', 'Risque de dommages internes'],
  timing_chain_noise: ['Désynchronisation possible', 'Usure accélérée', 'Risque de casse moteur à terme'],
  injector_noise: ['Ratés moteur', 'Surconsommation', 'Émissions polluantes accrues'],
  idle_instability: ['Confort de conduite dégradé', 'Usure prématurée des composants', 'Consommation irrégulière'],
};

const CONSEQUENCES_BY_CATEGORY: Partial<Record<IssueCategory, string[]>> = {
  turbo: ['Perte de puissance', 'Surconsommation', 'Usure prématurée du turbocompresseur'],
  engine: ['Perte de performance', 'Usure accélérée', 'Risque de dommages mécaniques'],
  injection: ['Ratés moteur', 'Surconsommation', 'Pollution accrue'],
  distribution: ['Risque de casse moteur', 'Perte de synchronisation', 'Réparation coûteuse'],
};

export function getPossibleConsequences(issue: DiagnosticIssue): string[] {
  if (issue.id === 'normal_engine') return [];
  return (
    CONSEQUENCES_BY_ISSUE[issue.id] ??
    CONSEQUENCES_BY_CATEGORY[issue.categorie] ??
    issue.symptomesAudio.slice(0, 3)
  );
}
