Je souhaite créer une application qui s'appelle PRALLO.

## CONTEXTE GÉNÉRAL
Chaque année au mois de février, les étudiants de quatrième année de l’ETML reviennent de 
leur stage en entreprise. Il ne leur reste plus qu’un semestre à faire durant lequel se situe le TPI. 
En guise de préparation au TPI, les étudiants effectuent un projet d’approfondissement 
(P_APPRO) qui a pour but de les re-familiariser avec des méthodes de travail et/ou des 
technologies qu’ils n’ont pas utilisés durant une année entière, mais qu’ils vont devoir appliquer 
dans leur TPI. 
Chaque année, une des principales difficultés organisationnelles de la filière informatique est 
de déterminer quel étudiant fera quel projet P_APPRO avec quel enseignant. 
Le système « Project Allocator » (Prallo) à réaliser dans le cadre de ce TPI a pour but d’apporter 
une aide substantielle à la filière informatique dans ce moment compliqué.

## LIVRABLES ATTENDUS
- un dossier contenant le back-end Adonis.js v6 (API REST)
- un dossier contenant le front-end Vue.js ( Single-Page-Application)
- un docker compose pour la base de donnée en MySQL
Le tout doit se trouver dans le dossier /src
## Analyse
Je veux que tu analyse plusieurs fichier et que le résultat corresponde.
- Un rapport décrivant la démarche du projet, les architectures, les diagrammes est disponible dans le dossier /doc/Rapport_TPI_Théo_Minger.pdf
- Des User story sont disponibles dans le fichier /doc/TPI_Prallo_project_US.md
- Des Maquettes sont disponibles dans le dossier Maquettes -> /doc/Maquettes/
- Un cahier des charges est disponible dans /doc/CdC Théo Minger_signé(theo).pdf

Je veux que tu analyses tous ces fichier et dossiers pour comprendre l'application en entière. Tu dois analyser toutes les images aussi

## Code
Suis mes directives concernant :
### Stack
- Node v22
- Front-end : Vue.js,Pinia,Axios,GSAP si besoin,Inertia si besoin,Vite,Vitest,Cypress
- Backend : Adonis.js V6,Jappa, Docker, MySQL
si des librairie sont déjà utilisé dans le framework pas besoin de télécharger des autres versions 
### Front-end
- Quand quelques chose se répète au niveau du front-end, crée des composant.
- Utilise Axios et Pinia quand c'est nécessaire
- intègre la connexion via compte eduvaud avec MSAL. Part du principe que j'ai toute les données concernant la connexion au services Azure ( Client_id,Tenant_id, etc...). celle si doit fonctionner en développement et en Staging. De plus ajoute un moyen de contourner cette connexion quand on est en mode dévelopement
### Back-end
- Il est important que chaque rôle à des permissions en fonction de l'état de PRALLO. je veux que tu stock dans la base de donnée au format JSON ces informations. Un exemple serait 1. Rôle = Professeur 2. Etat = Préparation 3. {editProject: true, deleteProject: false}. Le contrôle/attribution des permissions ce fait avant la redirection à la page d'accueil, via un middleware
- tout ce qui touche à la logique métier doit être écris dans les modèle et non dans les controlleur, comme son nom l'indique, le controlleur est la pour verifier si les condition du modèle sont respecté.
- Crée un seeder complet qui me permet de tester l'application quand je lance migration:fresh --seed
### Test
- Dans les User story, une partie # Gestion d'erreur est disponible : je veux que pour chaque erreurs possible décrite, tu crée un test unitaire à l'aide des librairies fourni dans les framework. De plus crée des test E2E pour tester un point spécifique par vue à l'aide de cypress
### Sécurité
- Respecte les normes de sécurité dans tout le code 
