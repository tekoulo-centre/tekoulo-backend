# Déploiement — Tekoulo Centre (backend en ligne)

Ce document reflète la procédure réellement suivie pour déployer ce projet, avec les pièges rencontrés et comment les éviter.

## 1. Dépôt GitHub

1. Crée un dépôt GitHub vide (coche "Add a README file" à la création).
2. Ajoute chaque fichier du backend un par un : package.json, render.yaml, db/pool.js, db/schema.sql, db/creer_premier_admin.js, middleware/auth.js, routes/auth.js, routes/eleves.js, routes/frais.js, routes/notes.js, routes/sync.js, routes/collections.js, routes/utilisateurs.js, server.js.
3. Piege a eviter : sur mobile, desactive la traduction automatique de Chrome sur github.com, elle peut interferer avec la saisie de noms de fichiers et creer des doublons avec accents.

## 2. Creer la base de donnees PostgreSQL sur Render

1. Sur render.com, connecte-toi avec GitHub (plus fiable que email/mot de passe).
2. Autorise Render a acceder a ton depot GitHub.
3. Dans ton projet, "+ New" puis PostgreSQL. Nom : tekoulo-db. Plan gratuit possible pour tester.
4. Attends que le statut passe a Available.

Note importante : la base gratuite Render expire apres 30 jours et sera supprimee si non mise a niveau, il faut surveiller cette echeance.

## 3. Creer le service web (API)

Le Blueprint automatique (via render.yaml) ne fonctionne pas toujours de facon fiable sur mobile. Si le service web n'apparait pas apres le Blueprint, cree-le manuellement :

1. "+ New" puis Web Service, selectionne le depot.
2. Nom : tekoulo-api. Runtime : Node. Build command : npm install. Start command : npm start.
3. Variable DATABASE_URL : ne pas taper le nom de la base (ex tekoulo-db), il faut la vraie chaine de connexion complete, assemblee depuis la section Connections de tekoulo-db sous la forme postgresql://Username:Password@Hostname:Port/Database.
4. Variable JWT_SECRET : une longue chaine aleatoire de ton choix, a garder secrete.
5. Create Web Service, attends Deploy succeeded puis Live.

## 4. Creer les tables et le premier compte (sans terminal)

Methode utilisee : ajouter temporairement une route d'installation dans server.js, l'appeler une fois via navigateur, puis la supprimer immediatement apres usage. Meme principe pour changer un mot de passe plus tard (route temporaire, appel unique, suppression immediate).

Astuce pratique : plutot que de coller un lien dans la barre d'adresse (le navigateur peut le confondre avec une recherche Google), creer un petit fichier html local avec un bouton qui fait l'appel via fetch, plus fiable sur mobile.

## 5. Connecter le frontend

Dans Tekoulo_Centre_v2_connecte.html, chercher la ligne TEKOULO_API_URL et la remplacer par l'URL reelle du service, par exemple https://tekoulo-api.onrender.com.

## 6. Verifications finales

- /api/health doit repondre status ok.
- Connexion a l'application avec le compte direction cree a l'etape 4.
- Ajouter une donnee test, fermer/rouvrir l'application, verifier qu'elle persiste.
- Verifier qu'aucune route temporaire ne repond plus (doit donner Cannot GET).

## Architecture reelle du projet

Le frontend HTML actuel n'utilise que deux routes serveur : /api/auth/login et /api/collections, un magasin generique cle-valeur avec fusion automatique par identifiant. Les routes relationnelles completes (eleves, frais, notes, sync) sont deployees et fonctionnelles cote serveur, mais ne sont pas branchees au HTML actuel, elles servent de base pour une evolution future.

## Cout estime

Plan gratuit Render : suffisant pour tester, mais le service web s'endort apres inactivite et la base expire apres 30 jours. Pour un usage reel en college, prevoir le plan Starter, environ 7 dollars par mois pour l'API plus 7 dollars par mois pour la base.
