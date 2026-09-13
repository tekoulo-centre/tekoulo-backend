# Guide Render — gestion courante du backend Tekoulo

Ce guide couvre l'utilisation quotidienne de Render une fois le backend deja deploye (pas l'installation initiale, voir DEPLOIEMENT.md pour ca).

## Se connecter a Render

1. Aller sur dashboard.render.com.
2. Se connecter avec le bouton GitHub (plus fiable que email/mot de passe sur mobile).
3. Le tableau de bord affiche les deux services du projet : tekoulo-api (le serveur) et tekoulo-db (la base de donnees).

## Verifier que tout fonctionne

1. Ouvrir tekoulo-api.
2. Regarder le badge de statut en haut : Live en vert veut dire que ca fonctionne. Deploying, Build failed ou Deploy failed indiquent un probleme.
3. Verification rapide depuis un navigateur : visiter https://tekoulo-api.onrender.com/api/health, qui doit repondre quelque chose comme status ok.

## Consulter les logs (utile en cas de probleme)

1. Ouvrir tekoulo-api.
2. Faire defiler jusqu'a la section des logs, ou chercher un onglet Logs.
3. Live tail affiche ce qui se passe en temps reel (utile pendant qu'on teste quelque chose).
4. Chercher les lignes en rouge ou contenant error pour identifier un probleme.

## Le service se reveille lentement (plan gratuit)

Sur le plan gratuit, le service s'endort apres une periode d'inactivite. La premiere requete apres une pause peut prendre 30 a 50 secondes avant de repondre (le temps que Render redemarre le service). Ce n'est pas une panne, juste une lenteur normale du plan gratuit. Pour eviter ca en usage reel, passer au plan payant Starter.

## Modifier une variable d'environnement (DATABASE_URL, JWT_SECRET)

1. Ouvrir tekoulo-api.
2. Aller dans la section Environment.
3. Taper sur Edit.
4. Modifier la valeur voulue.
5. Attention : DATABASE_URL doit etre la chaine de connexion complete (commence par postgresql://), jamais juste le nom de la base. La trouver sur la page tekoulo-db, section Connections (Hostname, Port, Database, Username, Password a assembler, ou une ligne Internal/External Database URL si disponible).
6. Taper sur Save, rebuild, and deploy. Attendre 1 a 2 minutes que le statut repasse a Live.

## Redemarrer le service manuellement

Si le service semble bloque sans raison apparente :
1. Ouvrir tekoulo-api.
2. Chercher le bouton Manual Deploy (en haut de la page).
3. Choisir de redeployer la derniere version.

## Un nouveau commit ne se deploie pas automatiquement

Normalement, chaque commit sur GitHub declenche un redeploiement automatique sur Render (Auto-Deploy, visible dans la liste des deploiements). Si ce n'est pas le cas :
1. Verifier dans les parametres du service que Auto-Deploy est bien active.
2. Sinon, utiliser Manual Deploy pour forcer le redeploiement du dernier commit.

## Suivre l'expiration de la base de donnees (plan gratuit)

1. Ouvrir tekoulo-db.
2. Une bannière en haut de page indique la date d'expiration si le plan est gratuit.
3. Avant cette date, soit exporter les donnees en securite, soit passer a un plan payant pour eviter la suppression automatique de la base.

## Changer de plan (gratuit vers payant)

1. Ouvrir le service concerne (tekoulo-api ou tekoulo-db).
2. Chercher le bouton ou lien Upgrade your instance / Upgrade.
3. Choisir le plan Starter (environ 7 dollars par mois par service) pour un usage reel sans coupure ni expiration.

## Erreurs frequentes et leur signification

| Message | Signification probable |
|---|---|
| getaddrinfo ENOTFOUND ... | DATABASE_URL mal configuree (nom au lieu de la vraie adresse, ou coupee) |
| Cannot GET /chemin | La route n'existe pas dans server.js (verifier orthographe ou redeploiement pas termine) |
| Non autorise (403) | La cle passee dans un lien ne correspond pas exactement a JWT_SECRET |
| Too many login attempts | Limitation temporaire de Render, attendre quelques minutes |
| Deploy failed | Erreur dans le code ou une dependance manquante, consulter les logs pour le detail exact |

## Bonnes pratiques de securite

- Ne jamais laisser une route de type installation-unique ou changer-mdp-unique active dans server.js plus longtemps que necessaire : creer, utiliser une fois, supprimer et re-deployer immediatement.
- Ne jamais partager de capture d'ecran affichant JWT_SECRET, un mot de passe de base de donnees, ou un mot de passe de compte utilisateur en clair.
- Si une valeur sensible a ete affichee par erreur (capture d'ecran, message partage), la considerer comme compromise et la changer des que possible.
