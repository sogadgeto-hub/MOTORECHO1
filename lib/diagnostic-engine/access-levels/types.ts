import type { IssueCategory, UrgencyLevel } from '../types';

export type UserPlan = 'free' | 'premium' | 'garage';

export type GeneralStatus = 'normal' | 'a_surveiller' | 'anomalie_probable';

export type SimplifiedSeverity = 'faible' | 'moyenne' | 'elevee';

export type WorkshopPriority = 'routine' | 'planifier' | 'urgent' | 'immediat';

export type FreeDiagnosticResult = {
  plan: 'free';
  lockedDetails: true;
  statutGeneral: GeneralStatus;
  categorieGenerale: string;
  graviteSimplifiee: SimplifiedSeverity;
  conseilCourt: string;
};

export type PremiumDiagnosticResult = {
  plan: 'premium';
  nom: string;
  categorie: IssueCategory;
  confiance: number;
  description: string;
  symptomesAudio: string[];
  niveauGravite: 1 | 2 | 3 | 4 | 5;
  niveauUrgence: UrgencyLevel;
  coutMoyenMin: number;
  coutMoyenMax: number;
  tempsReparationMoyenHeures: number;
  peutContinuerARouler: boolean;
  conseils: string[];
};

export type GarageMechanicNotes = {
  /** Champ réservé — saisie mécanicien (Sprint ultérieur) */
  contenu: string | null;
  /** Horodatage prévu pour la note atelier */
  updatedAt: string | null;
};

export type GaragePdfReport = {
  /** Titre du rapport professionnel */
  titre: string;
  /** Sections prévues pour l'export PDF */
  sections: string[];
  /** Indique si le rapport est prêt à être généré */
  pretExport: boolean;
};

export type GarageDiagnosticResult = Omit<PremiumDiagnosticResult, 'plan'> & {
  plan: 'garage';
  idTechnique: string;
  categorieTechnique: IssueCategory;
  prioriteAtelier: WorkshopPriority;
  notesMecanicien: GarageMechanicNotes;
  rapportPdf: GaragePdfReport;
};

export type DiagnosticAccessResult =
  | FreeDiagnosticResult
  | PremiumDiagnosticResult
  | GarageDiagnosticResult;
