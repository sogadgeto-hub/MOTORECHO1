# MotorEcho — Beta Device Test Checklist

Use this checklist during internal beta validation on **physical Android and iOS devices**.

For each test, record:

| Field | Notes |
|-------|--------|
| **Appareil** | Model name (e.g. Pixel 8, iPhone 14) |
| **Version OS** | e.g. Android 15, iOS 18.5 |
| **Résultat attendu** | Pre-filled below |
| **Résultat observé** | What actually happened |
| **Statut** | réussi / échoué / à vérifier |
| **Capture / note** | Screenshot or short note |
| **Bug #** | If failed, link to bug report |

**Version application testée:** _______________  
**Testeur:** _______________  
**Date:** _______________

---

## ANDROID

| # | Test | Résultat attendu | Appareil | OS | Observé | Statut | Note / Bug |
|---|------|------------------|----------|-----|---------|--------|------------|
| A1 | Permission accordée | Préparation → enregistrement démarre, indicateur qualité visible | | | | | |
| A2 | Permission refusée | Message clair, pas de crash, CTA pour réessayer | | | | | |
| A3 | Permission bloquée | Écran bloqué + lien vers paramètres système | | | | | |
| A4 | Retour depuis paramètres | Après autorisation micro, enregistrement fonctionne sans redémarrer l'app | | | | | |
| A5 | Enregistrement normal | 10 s max, preview, analyse, rapport affiché | | | | | |
| A6 | Écran verrouillé | Enregistrement interrompu proprement ou message d'interruption | | | | | |
| A7 | App en arrière-plan | Même comportement qu'écran verrouillé — pas de crash | | | | | |
| A8 | Appel entrant | Interruption audio gérée, micro libéré | | | | | |
| A9 | Bluetooth actif | Enregistrement et analyse OK (casque / voiture) | | | | | |
| A10 | Internet coupé | Après enregistrement : rapport local visible ; bannière si sauvegarde échoue | | | | | |
| A11 | Reprise Internet | Pas de doublon diagnostic ; pas de crash au retour réseau | | | | | |
| A12 | 10 analyses successives | Pas de fuite mémoire, navigation fluide, micro libéré | | | | | |
| A13 | Petit écran | UI lisible, boutons accessibles, pas de chevauchement | | | | | |
| A14 | Abonnement Free | Limites respectées, rapport Free, upgrade modal si limite | | | | | |
| A15 | Abonnement Premium | Rapport Premium, limites Premium | | | | | |
| A16 | Abonnement Garage | Rapport Garage, fonctionnalités Garage | | | | | |

---

## iOS

| # | Test | Résultat attendu | Appareil | OS | Observé | Statut | Note / Bug |
|---|------|------------------|----------|-----|---------|--------|------------|
| I1 | Permission accordée | Préparation → enregistrement démarre, indicateur qualité visible | | | | | |
| I2 | Permission refusée | Message clair, pas de crash, CTA pour réessayer | | | | | |
| I3 | Permission bloquée | Écran bloqué + lien vers Réglages | | | | | |
| I4 | Retour depuis paramètres | Après autorisation micro, enregistrement fonctionne sans redémarrer l'app | | | | | |
| I5 | Enregistrement normal | 10 s max, preview, analyse, rapport affiché | | | | | |
| I6 | Écran verrouillé | Enregistrement interrompu proprement ou message d'interruption | | | | | |
| I7 | App en arrière-plan | Même comportement — pas de crash | | | | | |
| I8 | Appel entrant | Interruption audio gérée, micro libéré | | | | | |
| I9 | Bluetooth actif | Enregistrement et analyse OK | | | | | |
| I10 | Internet coupé | Rapport local visible ; bannière si sauvegarde échoue | | | | | |
| I11 | Reprise Internet | Pas de doublon diagnostic ; pas de crash | | | | | |
| I12 | 10 analyses successives | Pas de fuite mémoire, navigation fluide, micro libéré | | | | | |
| I13 | Petit écran (SE / mini) | UI lisible, boutons accessibles | | | | | |
| I14 | Abonnement Free | Limites respectées, rapport Free | | | | | |
| I15 | Abonnement Premium | Rapport Premium | | | | | |
| I16 | Abonnement Garage | Rapport Garage | | | | | |

---

## Parcours principal (régression)

Confirmer sur **au moins 1 appareil Android et 1 iOS** :

```
Accueil → Analyser mon moteur → Préparation simple → Enregistrement → Traitement → Rapport
```

- [ ] Aucune étape supplémentaire obligatoire
- [ ] Pas de mode expert / analyse en roulant / choix de panne

---

## Outils bêta internes

En build dev ou avec `EXPO_PUBLIC_BETA_DIAGNOSTICS=1` :

- [ ] Paramètres → Beta diagnostics accessible
- [ ] Rapport technique copiable sans token / email / clé API
- [ ] Dernière erreur visible après un échec simulé

---

## Résumé session

| Plateforme | Tests réussis | Échoués | À vérifier |
|------------|---------------|---------|------------|
| Android | /16 | | |
| iOS | /16 | | |

**Prêt pour tag bêta ?** Non tant qu'Android + iOS ne sont pas complets.
