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

Si le message "Serveur injoignable, bascule en mode local temporaire" apparait : verifier d'abord que l'appareil est bien connecte a internet (essayer d'ouvrir un autre site pour confirmer). L'application continue de fonctionner en mode local en attendant, rien n'est perdu, la synchronisation reprendra automatiquement des que le reseau revient.

## Fonctionnement sans connexion internet

L'application est concue pour continuer a fonctionner meme sans reseau, mais avec des limites a connaitre :

- Si le reseau coupe pendant que l'application est deja ouverte : le travail continue normalement, tout est enregistre sur l'appareil, et la synchronisation avec le serveur reprend automatiquement des que le reseau revient.
- Si l'application est fermee puis rouverte sans reseau : l'ecran de connexion bascule sur un mot de passe local de secours, different du mot de passe du compte serveur (direction). Ce mot de passe local se change dans Parametres puis Securite.
- Sans reseau prolonge, le travail reste possible sur l'appareil utilise, mais les autres appareils ne verront pas les changements tant que la connexion n'est pas retablie.

## Utilisation au quotidien

- Toute saisie (eleve, note, paiement, et les autres modules) est enregistree automatiquement, localement puis envoyee au serveur.
- Les donnees sont partagees entre tous les appareils connectes au meme compte serveur : ce qui est saisi sur un telephone apparait sur les autres apres synchronisation.
- En cas de modification simultanee de la meme fiche par deux personnes sur deux appareils differents, la version la plus recente est conservee automatiquement (fusion par identifiant), sans ecran de confirmation manuelle pour l'instant.
- Hors connexion : le travail continue normalement, tout reste enregistre sur l'appareil ; des que le reseau revient, la synchronisation avec le serveur reprend automatiquement.

## Comptes et roles

Roles disponibles : direction, secretariat, comptabilite, enseignant, consultation.

Recommandation : chaque personne devrait avoir son propre compte avec le role approprie, plutot que de partager le compte direction entre plusieurs personnes. Cela permet de savoir qui a fait quoi grace au journal d'audit, et de limiter les degats en cas de mot de passe compromis (un seul compte a changer, pas le compte principal).

Actuellement, la creation de nouveaux comptes se fait via une requete technique a l'API (methode POST sur l'adresse /api/utilisateurs, avec le nom d'utilisateur, le mot de passe et le role souhaite). Contacter la personne technique en charge du projet pour creer un nouveau compte.

## Securite du mot de passe

- Ne jamais partager le mot de passe du compte direction par ecrit non securise (SMS, capture d'ecran partagee, etc).
- En cas de doute sur la confidentialite du mot de passe actuel, le faire changer par la personne technique en charge du projet.
- Chaque personne ayant acces a l'application devrait avoir son propre compte avec le role approprie, plutot que de partager le compte direction.

## Fonctionnement de Render (l'hebergement du serveur)

L'application se connecte a un serveur central heberge sur un service appele Render. Voici ce qu'il faut savoir sans avoir besoin de competences techniques :

- Render fait tourner en permanence le programme qui gere les donnees (tekoulo-api) et la base de donnees ou tout est stocke (tekoulo-db).
- Sur le plan gratuit actuellement utilise, le serveur peut se mettre en veille apres une periode sans utilisation. La premiere connexion apres une pause peut alors prendre 30 a 50 secondes avant de repondre : ce n'est pas une panne, juste le temps que le serveur se reveille.
- Verification rapide que le serveur fonctionne : ouvrir dans un navigateur l'adresse tekoulo-api.onrender.com/api/health, qui doit afficher un message contenant status ok.
- Le plan gratuit de la base de donnees expire apres un certain temps (a verifier sur le tableau de bord Render, page tekoulo-db) et sera supprime si non renouvele ou mis a niveau : la personne technique en charge du projet doit surveiller cette echeance.
- Pour un usage reel et sans coupure au quotidien, un plan payant (environ 7 dollars par mois par service) est recommande a terme.
- La gestion technique de Render (redeploiement, variables, logs) est reservee a la personne technique en charge du projet ; voir GUIDE_RENDER.md pour le detail de ces operations.

## Sauvegarde des donnees

Une sauvegarde manuelle complete de la base de donnees peut etre telechargee via un outil dedie (fichier sauvegarde-tekoulo.html, a demander a la personne technique si non disponible). Il est recommande de faire cette sauvegarde regulierement (par exemple chaque semaine) et de conserver le fichier obtenu dans un endroit different de l'appareil habituel (email a soi-meme, Google Drive).

## Architecture actuelle (a savoir)

L'application utilise un mecanisme de sauvegarde generique (magasin cle-valeur) qui couvre tous les modules existants (eleves, notes, frais, personnel, discipline, bibliotheque, etc). Ce mecanisme garantit qu'aucune donnee saisie n'est perdue et que tout se synchronise entre appareils. Une architecture plus poussee avec des regles metier serveur dediees (verrouillage d'annee scolaire, detection de conflit fin, calculs automatiques cote serveur) existe egalement pour les modules eleves, frais et notes, mais n'est pas encore celle utilisee par cette version de l'application ; elle sert de base pour une evolution future si besoin.

## En cas de probleme

- Ecran "Mot de passe incorrect" : verifier l'identifiant et le mot de passe ; en cas de doute, contacter la personne technique pour reinitialiser.
- Ecran "Serveur injoignable" : verifier en premier que l'appareil est connecte a internet (essayer un autre site) ; l'application reste utilisable en mode local en attendant.
- Toujours garder une sauvegarde exportee de temps en temps (bouton d'export des donnees, si disponible dans les parametres) en plus de la sauvegarde serveur, par prudence.
- Pour tout probleme technique plus serieux, contacter la personne en charge du deploiement avec une capture d'ecran du message d'erreur exact.
