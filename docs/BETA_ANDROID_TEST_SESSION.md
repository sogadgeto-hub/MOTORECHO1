# Session de test physique Android — MotorEcho

**Date:** 2026-07-18  
**Testeur:** _______________  
**Build installée:** `5221ed0c-4f1c-4ec8-9df8-ef5225acbf41`  
**Version app:** 1.0.0  
**Numéro de build Android (versionCode):** 1  
**Supabase (test):** `nplmhaaxvowvefnlwtlx.supabase.co` (voir `.env.local`)  
**Beta diagnostics actif:** ☐ Oui — vérifier Paramètres → Beta diagnostics après installation

### Installation Android

| | |
|---|---|
| **Page build EAS** | https://expo.dev/accounts/sogadgeto/projects/motorecho/builds/5221ed0c-4f1c-4ec8-9df8-ef5225acbf41 |
| **APK direct** | https://expo.dev/artifacts/eas/1J4fb5Kl2nk7JkCEgBLW-RehzeDbcXlticfd9hsNijM.apk |
| **Profil** | `beta-android` (APK, distribution internal) |
| **Variable bêta** | `EXPO_PUBLIC_BETA_DIAGNOSTICS=1` |

---

## Prérequis avant tests

- [ ] **Migration test Supabase** — `20260718000000_recording_quality_columns.sql` appliquée sur **test uniquement** (actuellement **NON appliquée** — voir section ci-dessous)
- [ ] Vérification colonnes : `npm run verify:supabase-quality-columns`
- [ ] **Variables EAS preview** — configurer Supabase/RevenueCat sur EAS puis rebuild si l'auth échoue (voir section ci-dessous)
- [ ] APK installé sur téléphone Android réel
- [ ] Compte test (Free / Premium / Garage) disponible

---

## Checklist Android (A1–A16)

| # | Test | Résultat attendu | Appareil | OS | Observé | Statut | Note / Bug |
|---|------|------------------|----------|-----|---------|--------|------------|
| A1 | Permission accordée | Préparation → enregistrement démarre, indicateur qualité visible | | | | ☐ réussi ☐ échoué ☐ à vérifier | |
| A2 | Permission refusée | Message clair, pas de crash, CTA pour réessayer | | | | | |
| A3 | Permission bloquée | Écran bloqué + lien vers paramètres système | | | | | |
| A4 | Retour depuis paramètres | Après autorisation micro, enregistrement OK sans redémarrer l'app | | | | | |
| A5 | Enregistrement normal | 10 s max, preview, analyse, rapport affiché | | | | | |
| A6 | Écran verrouillé | Interruption propre ou message d'interruption | | | | | |
| A7 | App en arrière-plan | Pas de crash, comportement cohérent | | | | | |
| A8 | Appel entrant | Interruption audio gérée, micro libéré | | | | | |
| A9 | Bluetooth actif | Enregistrement et analyse OK | | | | | |
| A10 | Internet coupé | Rapport local visible ; bannière si sauvegarde échoue | | | | | |
| A11 | Reprise Internet | Pas de doublon diagnostic ; pas de crash | | | | | |
| A12 | 10 analyses successives | Navigation fluide, micro libéré, pas de dégradation | | | | | |
| A13 | Petit écran | UI lisible, boutons accessibles | | | | | |
| A14 | Abonnement Free | Limites + rapport Free | | | | | |
| A15 | Abonnement Premium | Rapport Premium | | | | | |
| A16 | Abonnement Garage | Rapport Garage | | | | | |

---

## Outils bêta (build avec `EXPO_PUBLIC_BETA_DIAGNOSTICS=1`)

- [ ] Paramètres → **Beta diagnostics** accessible
- [ ] Rapport technique copiable (Share) — sans token / email / clé API
- [ ] Dernière erreur visible après échec simulé (ex. mode avion pendant sauvegarde)

---

## Parcours principal

```
Accueil → Analyser mon moteur → Préparation → Enregistrement → Traitement → Rapport
```

- [ ] Parcours complet sans étape supplémentaire obligatoire

---

## Résumé

| Tests réussis | Échoués | À vérifier | Bugs ouverts |
|---------------|---------|------------|--------------|
| /16 | | | |

**Bêta validée ?** Non — session en cours.
