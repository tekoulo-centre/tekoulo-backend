# Rapport global — Projet Tekoulo Centre (base connectee)

Date de ce rapport : 13 septembre 2026.

## 1. Contexte de depart

Le college disposait d'une application HTML fonctionnant uniquement en local sur chaque appareil (donnees stockees dans le navigateur, aucun partage entre appareils, aucune sauvegarde centrale). L'objectif de ce travail etait de connecter cette application a un serveur central, pour permettre le partage des donnees entre plusieurs personnes et appareils, sans perte de donnees.

## 2. Infrastructure mise en place

- Un serveur backend (Node.js/Express) a ete deploye sur Render, service nomme tekoulo-api.
- Une base de donnees PostgreSQL persistante a ete creee sur Render, service nomme tekoulo-db.
- Le code source du backend est versionne sur GitHub, depot tekoulo-centre/tekoulo-backend.
- Le fichier de l'application (Tekoulo_Centre_v2_connecte.html) a ete configure pour se connecter a ce serveur.
- Le systeme fonctionne desormais sur plusieurs appareils simultanement (telephone, ordinateur), avec synchronisation automatique des donnees.

## 3. Securite mise en place

- Mots de passe stockes de facon chiffree (jamais en clair) dans la base de donnees.
- Authentification par session securisee (jeton JWT), valable 8 heures.
- Verification des roles cote serveur : chaque compte (direction, secretariat, comptabilite, enseignant, consultation) n'a acces qu'aux actions autorisees pour son role.
- Le role consultation ne peut plus modifier de donnees via le mecanisme de sauvegarde generique (correction apportee en cours de projet, cette faille a ete identifiee et corrigee).
- Limitation du nombre de tentatives de connexion (protection contre les essais repetes de mot de passe).
- Connexion chiffree HTTPS de bout en bout (fournie automatiquement par Render).
- Le mot de passe initial du compte direction (genere pendant l'installation) a ete change pour un mot de passe choisi et non expose.
- Toutes les routes techniques temporaires utilisees pendant l'installation ont ete retirees du code apres usage.
- Un journal d'audit (table audit_log) enregistre les actions importantes effectuees sur les modules eleves, frais et notes.

## 4. Sauvegarde des donnees

- Un outil de sauvegarde manuelle (fichier sauvegarde-tekoulo.html) a ete cree, permettant de telecharger a tout moment une copie complete des donnees de la base, proteges par le compte direction.
- Une premiere sauvegarde a ete realisee et conservee par email, independamment du telephone utilise au quotidien.

## 5. Documentation creee

- DEPLOIEMENT.md : procedure technique complete de deploiement, avec les difficultes reellement rencontrees et leurs solutions.
- GUIDE_UTILISATEUR.md : guide d'usage quotidien pour le personnel du college, incluant le fonctionnement general de Render, la gestion hors connexion, et les comptes.
- GUIDE_RENDER.md : guide technique detaille pour la gestion courante de l'hebergement (logs, variables, erreurs frequentes).
- POLITIQUE_DONNEES.md : politique de protection des donnees des eleves, roles d'acces, procedure en cas de demande de suppression ou d'incident.

## 6. Ameliorations visuelles

- Toutes les icones du menu de l'application, auparavant en symboles simples noir et blanc, ont ete remplacees par des emojis colores et plus explicites pour chaque module.

## 7. Bugs rencontres et corriges pendant le projet

- Erreur de connexion a la base de donnees causee par une variable DATABASE_URL mal configuree (contenait le nom de la base au lieu de la vraie adresse de connexion) : corrigee.
- Fichier routes/eleves.js initialement cree avec un nom accentue, empechant le demarrage du serveur : corrige en recreant le fichier avec le bon nom.
- Blocage temporaire de connexion a Render du a des tentatives multiples : resolu en changeant de methode de connexion (GitHub au lieu de email/mot de passe).
- Route d'installation initiale non supprimee immediatement : corrige, la legon a ete documentee dans GUIDE_RENDER.md pour eviter que ca se reproduise.
- Bug introduit puis corrige le jour meme : le champ nom d'utilisateur affiche en majuscules envoyait par erreur la valeur en majuscules au serveur, empechant la connexion (le compte reel est enregistre en minuscules). Corrige en separant l'affichage visuel (majuscules) de la valeur reellement envoyee (minuscules).
- Route de sauvegarde (/api/backup) non presente sur le serveur en ligne malgre un premier essai de mise a jour du code : identifie via un outil de diagnostic dedie, puis corrige.

## 8. Limitation architecturale importante, a garder en tete

L'application HTML actuelle n'utilise que deux routes du serveur : la connexion (/api/auth/login) et un mecanisme generique de sauvegarde cle-valeur (/api/collections), qui fusionne automatiquement les donnees entre appareils par identifiant. C'est ce mecanisme qui garantit qu'aucune donnee n'est perdue au quotidien.

Une architecture plus avancee a egalement ete deployee sur le serveur pour les modules eleves, frais et notes (avec verrouillage d'annee scolaire, detection fine de conflits, journal d'audit detaille), mais elle n'est pas connectee a l'application HTML actuelle. Elle constitue une base solide pour une evolution future, mais brancher l'application dessus demanderait un travail de reecriture consequent, car les noms de champs et la structure des donnees different entre les deux systemes.

## 9. Recommandations pour l'avenir

Par ordre de priorite suggere :

1. Surveiller la date d'expiration de la base de donnees gratuite (visible sur le tableau de bord Render, page tekoulo-db) et passer a un plan payant avant cette echeance pour eviter toute perte de donnees.
2. Creer des comptes individuels pour chaque personne du personnel (secretariat, comptabilite, enseignants), plutot que de continuer a utiliser uniquement le compte direction partage.
3. Mettre en place une habitude reguliere de sauvegarde manuelle (par exemple chaque semaine) avec l'outil deja fourni, jusqu'a ce qu'une sauvegarde automatique programmee soit mise en place (disponible sur les plans payants de Render).
4. Envisager un ecran dans l'application pour la gestion des comptes utilisateurs (creation, desactivation), actuellement realisable uniquement via une requete technique directe.
5. Realiser un test avec plusieurs personnes utilisant l'application en meme temps, dans des conditions proches de la realite (par exemple pendant une periode d'inscriptions), pour verifier le bon comportement de la fusion automatique des donnees.
6. Limiter la taille des photos telechargees dans l'application (actuellement sans limite stricte cote serveur au-dela de 10 Mo par requete), pour eviter un ralentissement si beaucoup de photos sont ajoutees.
7. A plus long terme, si le besoin s'en fait sentir (par exemple une application mobile dediee, ou des besoins de reporting plus pousses), envisager la migration progressive vers l'architecture relationnelle deja construite cote serveur, module par module, en commencant par celui qui apporterait le plus de valeur (par exemple la gestion des frais et paiements).
8. Clarifier et documenter une regle precise de duree de conservation des donnees des eleves ayant quitte l'etablissement, actuellement laissee a titre de recommandation generale dans POLITIQUE_DONNEES.md.

## 10. Etat general du projet

Le systeme est fonctionnel, deploye, et documente. Il repond au besoin initial de partage des donnees entre appareils avec un mecanisme fiable de prevention de perte de donnees. Les limitations connues sont documentees plutot que cachees, ce qui permet une prise de decision eclairee sur les prochaines etapes.
