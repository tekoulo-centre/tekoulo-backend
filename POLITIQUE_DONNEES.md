# Politique de protection des donnees — College Tekoulo Centre

## Quelles donnees sont collectees

- Identite des eleves (nom, prenom, sexe, date de naissance selon les modules utilises).
- Resultats scolaires (notes, moyennes, classement).
- Informations financieres (frais de scolarite, historique des paiements).
- Selon les modules actives : photo, informations disciplinaires, informations sur le personnel.

## Qui peut acceder a quoi

| Role | Acces |
|---|---|
| direction | Acces complet a tous les modules, gestion des comptes |
| secretariat | Elèves, informations administratives |
| comptabilite | Frais et paiements |
| enseignant | Notes de ses classes |
| consultation | Lecture seule sur les modules autorises, aucune modification possible |

Chaque personne ayant acces a l'application dispose de son propre compte. Le partage d'un compte entre plusieurs personnes est deconseille, car il empeche de savoir qui a effectue quelle action (voir le journal d'audit).

## Ou sont stockees les donnees

Les donnees sont hebergees sur des serveurs Render (services tekoulo-api et tekoulo-db), avec connexion chiffree (HTTPS). Une sauvegarde manuelle reguliere est realisee et conservee separement (voir DEPLOIEMENT.md, section sauvegarde).

## Duree de conservation

A definir selon les besoins reels du college. Recommandation de depart : conserver les donnees d'un eleve jusqu'a un an apres son depart de l'etablissement, sauf obligation legale locale differente, puis les archiver ou les supprimer.

## Demande de suppression ou de correction de donnees

Si un parent ou une personne concernee demande la suppression ou la correction de ses donnees (ou celles de son enfant) :

1. Verifier l'identite de la personne qui fait la demande.
2. Contacter la personne technique en charge du projet pour effectuer la modification ou suppression dans la base de donnees.
3. Documenter la demande et la date de traitement (par exemple dans un registre simple, papier ou numerique).

Actuellement, la suppression ou correction se fait manuellement par la personne technique (pas encore d'ecran dedie dans l'application pour cette action specifique).

## Securite des mots de passe

- Chaque mot de passe est stocke de facon chiffree (jamais en clair) dans la base de donnees.
- Ne jamais partager un mot de passe par ecrit non securise (SMS, capture d'ecran partagee publiquement, reseaux sociaux).
- Changer un mot de passe immediatement s'il y a un doute sur sa confidentialite.

## En cas d'incident (perte de donnees, acces non autorise suspecte)

1. Contacter immediatement la personne technique en charge du projet.
2. Si un compte semble compromis, le desactiver depuis l'API (route PUT /api/utilisateurs/:id/desactiver) le temps de clarifier la situation.
3. Verifier le journal d'audit (table audit_log) pour identifier les actions recentes suspectes.
