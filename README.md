# ProxiService

Site vitrine responsive en français pour une plateforme qui met en relation les
particuliers avec les professionnels locaux à Safi, au Maroc.

## Structure

```text
.
├── assets/
│   └── favicon.svg
├── css/
│   └── styles.css
├── js/
│   ├── auth.js
│   └── main.js
├── connexion.html
├── index.html
├── inscription.html
├── tableau-de-bord.html
└── README.md
```

## Lancer le site

Ouvrez `index.html` dans un navigateur ou servez le dossier avec un serveur
statique local (par exemple l'extension Live Server de VS Code). Aucun
framework, compilation ou installation de dépendances n'est nécessaire. Une
connexion Internet est utilisée pour charger la police DM Sans / Manrope et la
photographie de la page d'accueil.

La recherche et les filtres de services fonctionnent côté navigateur sur les
exemples de profils inclus dans la page. Ces profils servent à la présentation
et ne représentent pas des professionnels vérifiés. L'adresse e-mail de contact
est également un exemple à remplacer avant la mise en ligne.

## Espace utilisateurs (démonstration)

- `inscription.html` crée un profil Client ou Professionnel. Le profil
  professionnel comprend le métier, la description des services, la ville et
  les tarifs indicatifs.
- `connexion.html` permet de retrouver un compte créé dans le même navigateur.
- `tableau-de-bord.html` affiche les demandes du client ou, pour un
  professionnel, la gestion de ses prestations et des demandes reçues.
- Les données de démonstration sont enregistrées dans le stockage local du
  navigateur. Le mot de passe est vérifié localement avec une empreinte simple,
  sans serveur, base de données ni mécanisme d'authentification sécurisé.
- Cette démonstration ne doit pas servir pour des comptes ou des données réels.
  Une authentification côté serveur et une base de données sont nécessaires
  avant toute mise en production.
