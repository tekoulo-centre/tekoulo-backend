# Guide utilisateur — College Tekoulo Centre (base connectee)

## Mise en route (deja faite, pour rappel)

Le backend est deploye sur Render (service tekoulo-api, base de donnees tekoulo-db) et le fichier Tekoulo_Centre_v2_connecte.html est deja configure pour s'y connecter. Rien a refaire pour une utilisation normale.

## Connexion quotidienne

1. Ouvrir le fichier Tekoulo_Centre_v2_connecte.html comme d'habitude.
2. Entrer l'identifiant et le mot de passe du compte (le compte principal est direction).
3. Taper sur le bouton de connexion.

Si le message "Serveur injoignable, bascule en mode local temporaire" apparait : verifier la connexion internet. L'application continue de fonctionner en mode local en attendant, rien n'est perdu, la synchronisation reprendra automatiquement des que le reseau revient.

## Utilisation au quotidien

- Toute saisie (eleve, note, paiement, et les autres modules) est enregistree automatiquement, localement puis envoyee au serveur.
- Les donnees sont partagees entre tous les appareils connectes au meme compte serveur : ce qui est saisi sur un telephone apparait sur les autres apres synchronisation.
- En cas de modification simultanee de la meme fiche par deux personnes sur deux appareils differents, la version la plus recente est conservee automatiquement (fusion par identifiant), sans ecran de confirmation manuelle pour l'instant.
- Hors connexion : le travail continue normalement, tout reste enregistre sur l'appareil ; des que le reseau revient, la synchronisation avec le serveur reprend automatiquement.

## Comptes et roles

Roles disponibles : direction, secretariat, comptabilite, enseignant, consultation.

Actuellement, la creation de nouveaux comptes se fait via une requete technique a l'API (pas encore d'ecran dedie dans l'application) :
