export type IssueCategory =
  | 'engine'
  | 'turbo'
  | 'injection'
  | 'distribution'
  | 'exhaust'
  | 'cooling'
  | 'electrical'
  | 'transmission'
  | 'suspension'
  | 'belt'
  | 'intake'
  | 'other';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Représentation structurée d'une panne moteur dans la base de connaissances locale.
 */
export type DiagnosticIssue = {
  /** Identifiant stable (snake_case), aligné avec les codes issue_type existants quand pertinent */
  id: string;
  /** Nom affichable de la panne */
  nom: string;
  /** Catégorie mécanique */
  categorie: IssueCategory;
  /** Description courte de la panne */
  description: string;
  /** Symptômes observables à l'écoute du moteur */
  symptomesAudio: string[];
  /** Niveau de gravité de 1 (mineur) à 5 (critique) */
  niveauGravite: 1 | 2 | 3 | 4 | 5;
  /** Niveau d'urgence d'intervention */
  niveauUrgence: UrgencyLevel;
  /** Confiance par défaut associée à cette hypothèse (0–1) */
  confianceParDefaut: number;
  /** Coût moyen minimum de réparation (EUR) */
  coutMoyenMin: number;
  /** Coût moyen maximum de réparation (EUR) */
  coutMoyenMax: number;
  /** Temps moyen de réparation (heures) */
  tempsReparationMoyenHeures: number;
  /** Peut-on continuer à rouler en sécurité raisonnable */
  peutContinuerARouler: boolean;
  /** Conseils pratiques pour le conducteur */
  conseils: string[];
};
