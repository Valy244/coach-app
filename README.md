# Coach Hub · appli de coaching (PWA)

Appli web installable sur téléphone, sans passer par l'App Store ni le Play Store.

- **Espace client** (sur téléphone) : séances de la semaine, objectif RIR, saisie des charges, répétitions et RIR série par série, minuteur de repos, bilan hebdomadaire (énergie, état nerveux, sommeil, douleurs), courbes de progression, programme en PDF.
- **Espace coach** (ordinateur ou téléphone) : création des clients et de leurs identifiants, éditeur de programme, réception des perfs en direct, surcharge progressive proposée selon le RIR, publication de la semaine suivante, PDF dans le style du programme Canva, réglages de la méthode.

Données hébergées sur **Supabase** (région Europe). Chaque client ne peut lire que ses propres données (sécurité au niveau de la base).

---

## Mise en route (une seule fois, environ 20 minutes)

### 1. Créer la base de données
1. Dans ton projet Supabase, ouvre **SQL Editor → New query**.
2. Colle tout le contenu du fichier `supabase/schema.sql`, puis clique sur **Run**.

### 2. Régler la connexion
1. **Authentication → Sign In / Providers → Email** : désactive **Confirm email**, puis enregistre.
   Sans ce réglage, chaque client devra d'abord cliquer sur un lien reçu par e-mail.
2. **Authentication → URL Configuration** :
   - **Site URL** : l'adresse de ton appli (étape 4), par exemple `https://tonpseudo.github.io/coach-app/`
   - Ajoute la même adresse dans **Redirect URLs** (utile pour « Mot de passe oublié »).

### 3. Relier l'appli à la base
Dans `config.js`, renseigne :
- `SUPABASE_URL` : la **Project URL** (Project Settings → API) ;
- `SUPABASE_KEY` : la clé **publishable** (ou **anon public**).

Ne mets jamais la clé `service_role` ou `secret` dans ce fichier.

### 4. Mettre l'appli en ligne avec GitHub Pages
1. Sur GitHub, dans le dépôt `coach-app` : **Settings → Pages**.
2. **Source** : *Deploy from a branch*, branche **main**, dossier **/(root)**, puis **Save**.
3. Après une à deux minutes, l'adresse s'affiche en haut de la page, par exemple `https://tonpseudo.github.io/coach-app/`.

### 5. Créer ton compte coach
Ouvre l'adresse de l'appli, puis clique sur **Créer mon compte coach**. Fais-le tout de suite : le premier compte créé devient automatiquement le compte coach.

### 6. Ajouter un client
Dans l'espace coach : **+ Nouveau client**, avec le prénom, l'e-mail, le mot de passe provisoire et le point de départ. L'appli génère le message à envoyer au client (lien, e-mail, mot de passe et explication pour l'installer).

La semaine de calibration est créée en **brouillon** : vérifie-la, puis clique sur **Publier**.

---

## Le cycle d'une semaine
1. Le client note ses séries dans l'appli à la salle, puis envoie son bilan.
2. Dans **Bilan & surcharge**, tu vois ses perfs et la proposition de charges pour la semaine suivante. Tu ajustes si besoin, puis **Préparer la semaine N**.
3. La nouvelle semaine est en brouillon. Vérifie-la, puis **Publier** : le client la reçoit dans son appli.

## À compléter
- `confidentialite.html` : ton nom et ton e-mail de contact (2 lignes entre crochets).

## Structure
```
index.html            page unique de l'appli
styles.css            apparence (couleurs, polices, mise en page)
config.js             connexion à Supabase
manifest.webmanifest  nom, icônes et couleurs de l'appli installée
sw.js                 service worker (installation, ouverture rapide)
js/app.js             connexion et choix de l'espace
js/client.js          espace client mobile
js/coach.js           espace coach
js/core.js            calculs (phases RIR, surcharge, progression)
js/pdf.js             génération du PDF
js/templates.js       modèle de programme 5 séances
ill/                  illustrations des exercices
icons/                icônes de l'appli
supabase/schema.sql   tables et règles de sécurité de la base
```
