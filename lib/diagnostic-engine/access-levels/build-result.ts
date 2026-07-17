import type { DiagnosticIssue, UrgencyLevel } from '../types';
import type {
  FreeDiagnosticResult,
  GarageDiagnosticResult,
  GeneralStatus,
  PremiumDiagnosticResult,
  SimplifiedSeverity,
  UserPlan,
  WorkshopPriority,
} from './types';

const CATEGORY_LABELS: Record<DiagnosticIssue['categorie'], string> = {
  engine: 'Moteur',
  turbo: 'Turbo / suralimentation',
  injection: 'Injection / alimentation',
  distribution: 'Distribution',
  exhaust: 'Échappement',
  cooling: 'Refroidissement',
  electrical: 'Électrique',
  transmission: 'Transmission',
  suspension: 'Suspension / roulement',
  belt: 'Courroies',
  intake: 'Admission',
  other: 'Général',
};

export function clampConfidence(confidence: number): number {
  if (Number.isNaN(confidence)) return 0;
  return Math.max(0, Math.min(1, confidence));
}

/** Source de vérité unique côté client — rejette toute valeur inconnue. */
export function normalizeUserPlan(plan: unknown): UserPlan {
  if (plan === 'free' || plan === 'premium' || plan === 'garage') {
    return plan;
  }
  return 'free';
}

export function resolveGeneralStatus(issue: DiagnosticIssue): GeneralStatus {
  if (issue.id === 'normal_engine' || issue.niveauGravite <= 1) {
    return 'normal';
  }
  if (issue.niveauGravite >= 4 || issue.niveauUrgence === 'critical') {
    return 'anomalie_probable';
  }
  return 'a_surveiller';
}

export function resolveSimplifiedSeverity(
  niveauGravite: DiagnosticIssue['niveauGravite']
): SimplifiedSeverity {
  if (niveauGravite <= 2) return 'faible';
  if (niveauGravite === 3) return 'moyenne';
  return 'elevee';
}

export function resolveGeneralCategoryLabel(categorie: DiagnosticIssue['categorie']): string {
  return CATEGORY_LABELS[categorie];
}

export function resolveShortAdvice(issue: DiagnosticIssue): string {
  return issue.conseils[0] ?? 'Surveillez l’évolution du bruit et consultez un professionnel si besoin.';
}

export function resolveWorkshopPriority(issue: DiagnosticIssue): WorkshopPriority {
  if (issue.niveauUrgence === 'critical' || issue.niveauGravite >= 5) {
    return 'immediat';
  }
  if (issue.niveauUrgence === 'high' || issue.niveauGravite >= 4) {
    return 'urgent';
  }
  if (issue.niveauUrgence === 'medium' || issue.niveauGravite === 3) {
    return 'planifier';
  }
  return 'routine';
}

function buildPremiumResult(
  issue: DiagnosticIssue,
  confidence: number
): PremiumDiagnosticResult {
  return {
    plan: 'premium',
    nom: issue.nom,
    categorie: issue.categorie,
    confiance: confidence,
    description: issue.description,
    symptomesAudio: [...issue.symptomesAudio],
    niveauGravite: issue.niveauGravite,
    niveauUrgence: issue.niveauUrgence,
    coutMoyenMin: issue.coutMoyenMin,
    coutMoyenMax: issue.coutMoyenMax,
    tempsReparationMoyenHeures: issue.tempsReparationMoyenHeures,
    peutContinuerARouler: issue.peutContinuerARouler,
    conseils: [...issue.conseils],
  };
}

export function buildFreeResult(issue: DiagnosticIssue): FreeDiagnosticResult {
  return {
    plan: 'free',
    lockedDetails: true,
    statutGeneral: resolveGeneralStatus(issue),
    categorieGenerale: resolveGeneralCategoryLabel(issue.categorie),
    graviteSimplifiee: resolveSimplifiedSeverity(issue.niveauGravite),
    conseilCourt: resolveShortAdvice(issue),
  };
}

export function buildPremiumResultFromIssue(
  issue: DiagnosticIssue,
  confidence: number
): PremiumDiagnosticResult {
  return buildPremiumResult(issue, clampConfidence(confidence));
}

export function buildGarageResult(
  issue: DiagnosticIssue,
  confidence: number
): GarageDiagnosticResult {
  const premium = buildPremiumResult(issue, clampConfidence(confidence));

  return {
    ...premium,
    plan: 'garage',
    idTechnique: issue.id,
    categorieTechnique: issue.categorie,
    prioriteAtelier: resolveWorkshopPriority(issue),
    notesMecanicien: {
      contenu: null,
      updatedAt: null,
    },
    rapportPdf: {
      titre: `Rapport atelier — ${issue.nom}`,
      sections: [
        'Identification véhicule',
        'Contexte d’écoute',
        'Hypothèse diagnostique',
        'Symptômes audio observés',
        'Gravité et urgence',
        'Estimation coût / délai',
        'Recommandations atelier',
        'Notes mécanicien',
      ],
      pretExport: false,
    },
  };
}

export function buildDiagnosticResult(
  issue: DiagnosticIssue,
  plan: UserPlan,
  confidence: number
): FreeDiagnosticResult | PremiumDiagnosticResult | GarageDiagnosticResult {
  const safePlan = normalizeUserPlan(plan);
  const safeConfidence = clampConfidence(confidence);

  switch (safePlan) {
    case 'free':
      return buildFreeResult(issue);
    case 'premium':
      return buildPremiumResultFromIssue(issue, safeConfidence);
    case 'garage':
      return buildGarageResult(issue, safeConfidence);
  }
}

/** Alias exporté pour faciliter les tests unitaires futurs */
export function urgencyRank(urgence: UrgencyLevel): number {
  const ranks: Record<UrgencyLevel, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  return ranks[urgence];
}
