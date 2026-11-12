# API ProxiService

Ce dossier contient l'API Node.js/Express de ProxiService. Le frontend reste
indépendant et n'embarque aucune clé ni aucun secret. L'API expose un contrôle
de santé et le premier service IA, ProxiBot. Les prochaines fonctionnalités IA
peuvent être ajoutées comme services dédiés, en réutilisant le fournisseur
OpenAI côté serveur.

## Prérequis

- Node.js 20 ou plus récent
- npm

## Installation locale

Depuis la racine du dépôt :

```bash
cd server
npm install
```

Copiez `.env.example` vers `.env`, puis ajustez `FRONTEND_ORIGINS` si le
frontend local utilise une autre origine. Live Server utilise souvent
`http://127.0.0.1:5500` ou `http://localhost:5500`. Les origines doivent être
exactes (schéma, hôte et port), séparées par des virgules. Les jokers sont
refusés et les origines de production doivent utiliser HTTPS.

Renseignez `OPENAI_API_KEY` dans le fichier `.env` local pour activer ProxiBot.
Cette clé est lue uniquement par le serveur et ne doit jamais être envoyée au
frontend ni commitée. `OPENAI_MODEL` permet de choisir le modèle ; la valeur
par défaut est `gpt-4.1-mini`.

Lancez l'API :

```bash
npm start
```

Pour le redémarrage automatique en développement :

```bash
npm run dev
```

L'API est disponible par défaut sur `http://localhost:3000`. Vérifiez-la sur
`http://localhost:3000/api/health`. ProxiBot est accessible via `POST /api/chat`
avec un tableau de messages :

```json
{"messages":[{"role":"user","content":"Bonjour ProxiBot"}]}
```

Lancez les tests avec `npm test`.

## Architecture et configuration de sécurité

Les routes API, contrôleurs, services métier IA et fournisseur OpenAI sont
séparés (`src/routes`, `src/controllers`, `src/services/ai` et
`src/providers`). Chaque nouvelle fonctionnalité IA peut ajouter son propre
service et contrôleur sans exposer de clé au client.

`PORT`, `RATE_LIMIT_WINDOW_MS` et `RATE_LIMIT_MAX` doivent être des entiers
positifs. `NODE_ENV` doit valoir `development`, `test` ou `production`.
`FRONTEND_ORIGINS` est obligatoire et doit contenir des origines exactes ;
aucun CORS avec joker n'est activé. En production, les origines doivent être
en HTTPS et `OPENAI_API_KEY` est obligatoire. Les corps JSON sont limités à
10 Ko ; Helmet et une limitation de débit par IP protègent l'API.

Les appels OpenAI ont un délai maximal de 30 secondes et une seule nouvelle
tentative. Les erreurs fournisseur ne sont pas renvoyées au client. Ne
commitez jamais `.env` et ne placez aucun secret dans le frontend.
