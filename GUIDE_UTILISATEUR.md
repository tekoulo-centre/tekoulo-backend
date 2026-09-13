# Guide utilisateur — College Tekoulo Centre (base connectee)

## Mise en route (deja faite, pour rappel)

Le backend est deploye sur Render (service tekoulo-api, base de donnees tekoulo-db) et le fichier Tekoulo_Centre_v2_connecte.html est deja configure pour s'y connecter. Rien a refaire pour une utilisation normale.

## Utiliser l'application sur un nouvel appareil (ordinateur, autre telephone)

1. Copier le fichier Tekoulo_Centre_v2_connecte.html sur le nouvel appareil (email, cle USB, Google Drive, WhatsApp, peu importe le moyen).
2. L'ouvrir normalement dans n'importe quel navigateur (Chrome, Safari, Edge).
3. Se connecter avec un identifiant et mot de passe valides.

Aucune donnee n'a besoin d'etre transferee avec le fichier : comme l'application se connecte au meme serveur central, les donnees deja saisies apparaissent automatiquement des la connexion. Le fichier HTML ne contient que le programme, pas les donnees.

## Connexion quotidienne

1. Ouvrir le fichier Tekoulo_Centre_v2_connecte.html comme d'habitude.
2. Entrer l'identifiant et le mot de passe du compte.
3. Taper sur le bouton de connexion.

Si le message "Serveur injoignable, bascule en mode local temporaire" apparait : verifier la connexion internet. L'application continue de fonctionner en mode local en attendant, rien n'est perdu, la synchronisation reprendra automatiquement des que le reseau revient.

## Utilisation au quotidien

- Toute saisie (eleve, note, paiement, et les autres modules) est enregistree automatiquement, localement puis envoyee au serveur.
- Les donnees sont partagees entre tous les appareils connectes au meme compte serveur : ce qui est saisi sur un telephone apparait sur les autres apres synchronisation.
- En cas de modification simultanee de la meme fiche par deux personnes sur deux appareils differents, la version la plus recente est conservee automatiquement (fusion par identifiant), sans ecran de confirmation manuelle pour l'instant.
- Hors connexion : le travail continue normalement, tout reste enregistre sur l'appareil ; des que le reseau revient, la synchronisation avec le serveur reprend automatiquement.

## Comptes et roles

Roles disponibles : direction, secretariat, comptabilite, enseignant, consultation.

Recommandation : chaque personne devrait avoir son propre compte avec le role approprie, plutot que de partager le compte direction entre plusieurs personnes. Cela permet de savoir qui a fait quoi grace au journal d'audit, et de limiter les degats en cas de mot de passe compromis (un seul compte a changer, pas le compte principal).

Actuellement, la creation de nouveaux comptes se fait via une requete technique a l'API (pas encore d'ecran dedie dans l'application) :
