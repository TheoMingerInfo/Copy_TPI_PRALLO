import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Skill from '#models/skill'
import Project from '#models/project'
import Vote from '#models/vote'
import Role from '#models/role'
import type { UserRole } from '#models/role'
import PermissionsSeeder from './permissions_seeder.js'

export default class MainSeeder extends BaseSeeder {
  async run() {
    console.log('🌱 Seeding PRALLO database...')

    await new PermissionsSeeder(this.client).run()
    await this.seedUsers()
    await this.seedSkills()
    await this.seedProjects()
    await this.seedVotes()

    console.log('✅ Seeding terminé !')
  }

  // ───────────────────────────────────────────────────────────────────────────
  private async seedUsers() {
    const roles = await Role.all()
    const getRoleId = (name: UserRole) => roles.find((r) => r.name === name)!.id

    const users = [
      // Doyen
      { firstName: 'Alice', lastName: 'Doyen', email: 'alice.doyen@eduvaud.ch', roleId: getRoleId('doyen'), maxProjects: 3 },

      // Professeurs (18 au total)
      { firstName: 'Bob', lastName: 'Martin', email: 'bob.martin@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 3 },
      { firstName: 'Claire', lastName: 'Dupont', email: 'claire.dupont@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'David', lastName: 'Leclerc', email: 'david.leclerc@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'Etienne', lastName: 'Moreau', email: 'etienne.moreau@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'Francoise', lastName: 'Petit', email: 'francoise.petit@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'Gilles', lastName: 'Robert', email: 'gilles.robert@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'Helene', lastName: 'Richard', email: 'helene.richard@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'Ivan', lastName: 'Dumont', email: 'ivan.dumont@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'Julie', lastName: 'Garnier', email: 'julie.garnier@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'Kevin', lastName: 'Faure', email: 'kevin.faure@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'Laura', lastName: 'Rousseau', email: 'laura.rousseau@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'Marc', lastName: 'Blanc', email: 'marc.blanc@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'Nathalie', lastName: 'Guerin', email: 'nathalie.guerin@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'Olivier', lastName: 'Chevalier', email: 'olivier.chevalier@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'Patricia', lastName: 'Morin', email: 'patricia.morin@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'Quentin', lastName: 'Lefevre', email: 'quentin.lefevre@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'Renee', lastName: 'Mercier', email: 'renee.mercier@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },
      { firstName: 'Sylvain', lastName: 'Lemaire', email: 'sylvain.lemaire@eduvaud.ch', roleId: getRoleId('professeur'), maxProjects: 2 },

      // Étudiants (55 au total)
      { firstName: 'Emma', lastName: 'Muller', email: 'emma.muller@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Felix', lastName: 'Renaud', email: 'felix.renaud@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Grace', lastName: 'Bernard', email: 'grace.bernard@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Hugo', lastName: 'Simon', email: 'hugo.simon@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Iris', lastName: 'Thomas', email: 'iris.thomas@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Jules', lastName: 'Durand', email: 'jules.durand@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Amelie', lastName: 'Girard', email: 'amelie.girard@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Baptiste', lastName: 'Roux', email: 'baptiste.roux@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Camille', lastName: 'Vincent', email: 'camille.vincent@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Damien', lastName: 'Fournier', email: 'damien.fournier@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Elisa', lastName: 'Morel', email: 'elisa.morel@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Florian', lastName: 'Giraud', email: 'florian.giraud@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Gaelle', lastName: 'Andre', email: 'gaelle.andre@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Herve', lastName: 'Leroy', email: 'herve.leroy@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Ines', lastName: 'Perrin', email: 'ines.perrin@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Julien', lastName: 'Clement', email: 'julien.clement@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Karine', lastName: 'Gauthier', email: 'karine.gauthier@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Laurent', lastName: 'Bertrand', email: 'laurent.bertrand@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Marine', lastName: 'Fontaine', email: 'marine.fontaine@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Nicolas', lastName: 'Roussel', email: 'nicolas.roussel@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Ophelie', lastName: 'Bonnet', email: 'ophelie.bonnet@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Pierre', lastName: 'Dupuis', email: 'pierre.dupuis@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Quentin', lastName: 'Masson', email: 'quentin.masson@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Rachel', lastName: 'Colin', email: 'rachel.colin@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Samuel', lastName: 'Aubert', email: 'samuel.aubert@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Thibault', lastName: 'Caron', email: 'thibault.caron@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Ursula', lastName: 'Picard', email: 'ursula.picard@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Valentin', lastName: 'Renard', email: 'valentin.renard@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Wendy', lastName: 'Arnaud', email: 'wendy.arnaud@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Xavier', lastName: 'Millet', email: 'xavier.millet@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Yann', lastName: 'Noel', email: 'yann.noel@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Zoe', lastName: 'Leger', email: 'zoe.leger@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Adrien', lastName: 'Vidal', email: 'adrien.vidal@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Beatrice', lastName: 'Gros', email: 'beatrice.gros@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Cedric', lastName: 'Vasseur', email: 'cedric.vasseur@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Delphine', lastName: 'Hubert', email: 'delphine.hubert@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Edouard', lastName: 'Brun', email: 'edouard.brun@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Fabienne', lastName: 'Leclercq', email: 'fabienne.leclercq@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Guillaume', lastName: 'Denis', email: 'guillaume.denis@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Heloise', lastName: 'Breton', email: 'heloise.breton@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Isabelle', lastName: 'Lacroix', email: 'isabelle.lacroix@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Jerome', lastName: 'Lecomte', email: 'jerome.lecomte@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Karen', lastName: 'Barbier', email: 'karen.barbier@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Louis', lastName: 'Perez', email: 'louis.perez@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Manon', lastName: 'Jacquet', email: 'manon.jacquet@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Nathan', lastName: 'Schmitt', email: 'nathan.schmitt@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Oceane', lastName: 'Klein', email: 'oceane.klein@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Paul', lastName: 'Henry', email: 'paul.henry@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Quentin', lastName: 'Blanchard', email: 'quentin.blanchard@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Roxane', lastName: 'Lamy', email: 'roxane.lamy@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Sebastien', lastName: 'Pages', email: 'sebastien.pages@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Tania', lastName: 'Prevot', email: 'tania.prevot@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Ulysse', lastName: 'Carpentier', email: 'ulysse.carpentier@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Virginie', lastName: 'Charpentier', email: 'virginie.charpentier@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'William', lastName: 'Cousin', email: 'william.cousin@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Ximena', lastName: 'Navarro', email: 'ximena.navarro@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },
      { firstName: 'Yanis', lastName: 'Mallet', email: 'yanis.mallet@eduvaud.ch', roleId: getRoleId('etudiant'), maxProjects: null },

      // Invité
      { firstName: 'Karl', lastName: 'Invite', email: 'karl.invite@eduvaud.ch', roleId: getRoleId('invite'), maxProjects: null },
    ]

    for (const u of users) {
      await User.updateOrCreate({ email: u.email }, u)
    }
    const profs = users.filter((u) => u.roleId === getRoleId('professeur')).length
    const students = users.filter((u) => u.roleId === getRoleId('etudiant')).length
    console.log(`  ✓ Users: ${profs} professeurs, ${students} étudiants`)
  }

  // ───────────────────────────────────────────────────────────────────────────
  private async seedSkills() {
    const skillNames = [
      'PHP', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++',
      'Vue.js', 'React', 'Angular', 'Node.js', 'Laravel', 'Adonis.js',
      'MySQL', 'PostgreSQL', 'MongoDB', 'Docker', 'Git', 'Linux', 'REST API',
    ]

    for (const name of skillNames) {
      await Skill.updateOrCreate({ name }, { name })
    }

    const skills = await Skill.all()
    const s = (name: string) => skills.find((x) => x.name === name)!

    const profSkills: Record<string, string[]> = {
      'bob.martin@eduvaud.ch':        ['JavaScript', 'TypeScript', 'Vue.js', 'Node.js'],
      'claire.dupont@eduvaud.ch':     ['PHP', 'Laravel', 'MySQL'],
      'david.leclerc@eduvaud.ch':     ['Python', 'Docker', 'Linux'],
      'etienne.moreau@eduvaud.ch':    ['Java', 'PostgreSQL', 'REST API'],
      'francoise.petit@eduvaud.ch':   ['React', 'JavaScript', 'TypeScript'],
      'gilles.robert@eduvaud.ch':     ['C#', 'MySQL', 'REST API'],
      'helene.richard@eduvaud.ch':    ['Python', 'MongoDB', 'REST API'],
      'ivan.dumont@eduvaud.ch':       ['Docker', 'Linux', 'Git'],
      'julie.garnier@eduvaud.ch':     ['Vue.js', 'Node.js', 'MongoDB'],
      'kevin.faure@eduvaud.ch':       ['Angular', 'TypeScript', 'REST API'],
      'laura.rousseau@eduvaud.ch':    ['PHP', 'MySQL', 'Laravel'],
      'marc.blanc@eduvaud.ch':        ['C++', 'Linux', 'Git'],
      'nathalie.guerin@eduvaud.ch':   ['Java', 'PostgreSQL', 'Docker'],
      'olivier.chevalier@eduvaud.ch': ['JavaScript', 'React', 'Node.js'],
      'patricia.morin@eduvaud.ch':    ['Python', 'PostgreSQL', 'REST API'],
      'quentin.lefevre@eduvaud.ch':   ['Adonis.js', 'TypeScript', 'MySQL'],
      'renee.mercier@eduvaud.ch':     ['C#', 'Docker', 'Git'],
      'sylvain.lemaire@eduvaud.ch':   ['Vue.js', 'JavaScript', 'REST API'],
      'alice.doyen@eduvaud.ch':       ['REST API', 'Git', 'Linux'],
    }

    for (const [email, skillList] of Object.entries(profSkills)) {
      const user = await User.findBy('email', email)
      if (user) await user.related('skills').sync(skillList.map((n) => s(n).id))
    }

    console.log(`  ✓ Skills: ${skillNames.length}`)
  }

  // ───────────────────────────────────────────────────────────────────────────
  private async seedProjects() {
    const skills = await Skill.all()
    const s = (name: string) => skills.find((x) => x.name === name)!

    const profEmails = [
      'bob.martin@eduvaud.ch', 'claire.dupont@eduvaud.ch', 'david.leclerc@eduvaud.ch',
      'etienne.moreau@eduvaud.ch', 'francoise.petit@eduvaud.ch', 'gilles.robert@eduvaud.ch',
      'helene.richard@eduvaud.ch', 'ivan.dumont@eduvaud.ch', 'julie.garnier@eduvaud.ch',
      'kevin.faure@eduvaud.ch', 'laura.rousseau@eduvaud.ch', 'marc.blanc@eduvaud.ch',
      'nathalie.guerin@eduvaud.ch', 'olivier.chevalier@eduvaud.ch', 'patricia.morin@eduvaud.ch',
      'quentin.lefevre@eduvaud.ch', 'renee.mercier@eduvaud.ch', 'sylvain.lemaire@eduvaud.ch',
    ]
    const profs = await User.query().whereIn('email', profEmails)
    const p = (email: string) => profs.find((u) => u.email === email)!

    const projectsData = [
      // Projets originaux
      { title: 'App Vue.js Dashboard',description: "Création d'un tableau de bord interactif avec Vue.js et une API REST.",          professorId: p('bob.martin@eduvaud.ch').id,        isMandatory: true,  maxStudents: 1, skillIds: [s('Vue.js').id, s('TypeScript').id, s('REST API').id] },
      { title: "Système d'authentification", description: "Mise en place d'un système d'authentification complet avec JWT et gestion des rôles.", professorId: p('bob.martin@eduvaud.ch').id,        isMandatory: false, maxStudents: 1, skillIds: [s('Node.js').id, s('JavaScript').id, s('MySQL').id] },
      { title: 'API REST Laravel',           description: "Développement d'une API RESTful complète avec Laravel, validation et documentation.", professorId: p('claire.dupont@eduvaud.ch').id,     isMandatory: true,  maxStudents: 1, skillIds: [s('PHP').id, s('Laravel').id, s('MySQL').id] },
      { title: 'Migrations base de données', description: "Conception et implémentation d'une stratégie de migration de base de données.",      professorId: p('claire.dupont@eduvaud.ch').id,     isMandatory: false, maxStudents: 1, skillIds: [s('MySQL').id, s('PHP').id] },
      { title: 'Pipeline CI/CD Docker',      description: "Mise en place d'un pipeline CI/CD avec Docker, tests automatisés et déploiement.",  professorId: p('david.leclerc@eduvaud.ch').id,     isMandatory: false, maxStudents: 1, skillIds: [s('Docker').id, s('Linux').id, s('Git').id] },
      { title: 'Analyse de données Python',  description: "Exploration et analyse de données avec Python, Pandas et visualisation Matplotlib.", professorId: p('david.leclerc@eduvaud.ch').id,     isMandatory: false, maxStudents: 1, skillIds: [s('Python').id, s('Linux').id] },
      // 30 nouveaux projets
      { title: 'Microservices Java Spring',        description: "Architecture microservices avec Spring Boot, communication REST et base PostgreSQL.",    professorId: p('etienne.moreau@eduvaud.ch').id,    isMandatory: false, maxStudents: 1, skillIds: [s('Java').id, s('REST API').id, s('PostgreSQL').id] },
      { title: 'API GraphQL Node.js',              description: "Développement d'une API GraphQL avec Node.js et Apollo Server.",                          professorId: p('etienne.moreau@eduvaud.ch').id,    isMandatory: false, maxStudents: 1, skillIds: [s('Node.js').id, s('JavaScript').id, s('PostgreSQL').id] },
      { title: 'Application React e-commerce',     description: "Boutique en ligne complète avec React, panier, paiement et gestion des stocks.",          professorId: p('francoise.petit@eduvaud.ch').id,   isMandatory: true,  maxStudents: 1, skillIds: [s('React').id, s('JavaScript').id, s('REST API').id] },
      { title: 'Dashboard React Analytics',        description: "Tableau de bord analytique avec React, graphiques interactifs et filtres dynamiques.",    professorId: p('francoise.petit@eduvaud.ch').id,   isMandatory: false, maxStudents: 1, skillIds: [s('React').id, s('TypeScript').id] },
      { title: 'Application C# WinForms',          description: "Application de gestion desktop avec C# WinForms et base de données MySQL.",               professorId: p('gilles.robert@eduvaud.ch').id,     isMandatory: false, maxStudents: 1, skillIds: [s('C#').id, s('MySQL').id] },
      { title: 'API REST C# ASP.NET',              description: "API RESTful avec ASP.NET Core, authentification JWT et Entity Framework.",                 professorId: p('gilles.robert@eduvaud.ch').id,     isMandatory: false, maxStudents: 1, skillIds: [s('C#').id, s('REST API').id, s('MySQL').id] },
      { title: 'ML Classification Python',         description: "Modèle de classification par machine learning avec scikit-learn et MongoDB.",              professorId: p('helene.richard@eduvaud.ch').id,    isMandatory: false, maxStudents: 1, skillIds: [s('Python').id, s('MongoDB').id] },
      { title: 'API Python FastAPI',               description: "API haute performance avec FastAPI, validation Pydantic et documentation automatique.",    professorId: p('helene.richard@eduvaud.ch').id,    isMandatory: false, maxStudents: 1, skillIds: [s('Python').id, s('REST API').id, s('MongoDB').id] },
      { title: 'Orchestration Kubernetes',         description: "Déploiement et orchestration de conteneurs avec Kubernetes sur cluster local.",            professorId: p('ivan.dumont@eduvaud.ch').id,       isMandatory: false, maxStudents: 1, skillIds: [s('Docker').id, s('Linux').id, s('Git').id] },
      { title: 'Monitoring Prometheus Grafana',    description: "Mise en place du monitoring applicatif avec Prometheus, Grafana et alertes.",              professorId: p('ivan.dumont@eduvaud.ch').id,       isMandatory: false, maxStudents: 1, skillIds: [s('Docker').id, s('Linux').id] },
      { title: 'App mobile Vue.js Capacitor',      description: "Application mobile cross-platform avec Vue.js et Capacitor pour iOS et Android.",         professorId: p('julie.garnier@eduvaud.ch').id,     isMandatory: false, maxStudents: 1, skillIds: [s('Vue.js').id, s('JavaScript').id] },
      { title: 'Chat temps réel Socket.io',   description: "Application de messagerie instantanée avec Node.js, Socket.io et MongoDB.",               professorId: p('julie.garnier@eduvaud.ch').id,     isMandatory: false, maxStudents: 1, skillIds: [s('Node.js').id, s('MongoDB').id, s('JavaScript').id] },
      { title: 'SPA Angular Material',             description: "Application single-page avec Angular et Material Design, formulaires réactifs.",           professorId: p('kevin.faure@eduvaud.ch').id,       isMandatory: false, maxStudents: 1, skillIds: [s('Angular').id, s('TypeScript').id] },
      { title: 'Angular PWA Offline',              description: "Progressive Web App Angular avec mode hors-ligne, service workers et synchronisation.",    professorId: p('kevin.faure@eduvaud.ch').id,       isMandatory: false, maxStudents: 1, skillIds: [s('Angular').id, s('TypeScript').id, s('REST API').id] },
      { title: 'Système de blog Laravel',          description: "Plateforme de blog complète avec Laravel, gestion des articles, commentaires et tags.",   professorId: p('laura.rousseau@eduvaud.ch').id,    isMandatory: false, maxStudents: 1, skillIds: [s('PHP').id, s('Laravel').id, s('MySQL').id] },
      { title: 'E-commerce PHP from scratch',      description: "Site e-commerce développé en PHP natif avec panier et gestion des commandes.",            professorId: p('laura.rousseau@eduvaud.ch').id,    isMandatory: true,  maxStudents: 1, skillIds: [s('PHP').id, s('MySQL').id] },
      { title: 'Jeu 2D C++ SDL',                   description: "Développement d'un jeu vidéo 2D en C++ avec la bibliothèque SDL2.",                       professorId: p('marc.blanc@eduvaud.ch').id,        isMandatory: false, maxStudents: 1, skillIds: [s('C++').id, s('Linux').id] },
      { title: 'Compilateur C++ simplifié',         description: "Implémentation d'un compilateur pour un langage simplifié en C++.",                       professorId: p('marc.blanc@eduvaud.ch').id,        isMandatory: false, maxStudents: 1, skillIds: [s('C++').id, s('Git').id] },
      { title: 'ERP Java PostgreSQL',              description: "Système ERP modulaire avec Java, gestion des stocks, RH et comptabilité.",                 professorId: p('nathalie.guerin@eduvaud.ch').id,   isMandatory: false, maxStudents: 1, skillIds: [s('Java').id, s('PostgreSQL').id, s('Docker').id] },
      { title: 'App Java Swing inventaire',        description: "Application de gestion d'inventaire avec Java Swing et base de données PostgreSQL.",       professorId: p('nathalie.guerin@eduvaud.ch').id,   isMandatory: false, maxStudents: 1, skillIds: [s('Java').id, s('PostgreSQL').id] },
      { title: 'SPA React blog personnel',         description: "Blog personnel single-page avec React, markdown et système de commentaires.",              professorId: p('olivier.chevalier@eduvaud.ch').id, isMandatory: false, maxStudents: 1, skillIds: [s('React').id, s('Node.js').id, s('JavaScript').id] },
      { title: 'Scraper Node.js visuel',  description: "Scraper web avec Node.js, stockage MongoDB et visualisation des données collectées.",     professorId: p('olivier.chevalier@eduvaud.ch').id, isMandatory: false, maxStudents: 1, skillIds: [s('Node.js').id, s('JavaScript').id, s('MongoDB').id] },
      { title: 'Dashboard données climatiques',    description: "Visualisation de données climatiques ouvertes avec Python et PostgreSQL.",                 professorId: p('patricia.morin@eduvaud.ch').id,    isMandatory: false, maxStudents: 1, skillIds: [s('Python').id, s('PostgreSQL').id, s('REST API').id] },
      { title: 'Chatbot Python NLP',               description: "Assistant conversationnel avec traitement du langage naturel en Python.",                  professorId: p('patricia.morin@eduvaud.ch').id,    isMandatory: false, maxStudents: 1, skillIds: [s('Python').id, s('REST API').id] },
      { title: 'API AdonisJS multi-tenant',        description: "API multi-tenant avec AdonisJS, isolation des données par organisation.",                  professorId: p('quentin.lefevre@eduvaud.ch').id,   isMandatory: false, maxStudents: 1, skillIds: [s('Adonis.js').id, s('TypeScript').id, s('MySQL').id] },
      { title: 'Gestion tâches TypeScript', description: "Application de gestion de tâches avec TypeScript, drag & drop et persistance MySQL.",    professorId: p('quentin.lefevre@eduvaud.ch').id,   isMandatory: false, maxStudents: 1, skillIds: [s('TypeScript').id, s('MySQL').id] },
      { title: 'CI/CD C# GitHub Actions',          description: "Pipeline CI/CD complet pour application C# avec GitHub Actions et déploiement Docker.",   professorId: p('renee.mercier@eduvaud.ch').id,     isMandatory: false, maxStudents: 1, skillIds: [s('C#').id, s('Docker').id, s('Git').id] },
      { title: 'Reverse proxy Nginx Docker',       description: "Infrastructure avec reverse proxy Nginx, SSL, load balancing et conteneurs Docker.",      professorId: p('renee.mercier@eduvaud.ch').id,     isMandatory: false, maxStudents: 1, skillIds: [s('Docker').id, s('Linux').id, s('Git').id] },
      { title: 'Portfolio Vue.js animé',           description: "Portfolio professionnel animé avec Vue.js, transitions CSS et formulaire de contact.",     professorId: p('sylvain.lemaire@eduvaud.ch').id,   isMandatory: false, maxStudents: 1, skillIds: [s('Vue.js').id, s('JavaScript').id] },
      { title: 'WebSocket Vue.js temps réel',      description: "Application collaborative temps réel avec Vue.js, WebSocket et synchronisation d'état.",  professorId: p('sylvain.lemaire@eduvaud.ch').id,   isMandatory: false, maxStudents: 1, skillIds: [s('Vue.js').id, s('REST API').id, s('JavaScript').id] },
    ]

    for (const pd of projectsData) {
      const { skillIds, ...fields } = pd
      const project = await Project.updateOrCreate({ title: pd.title }, fields)
      await project.related('skills').sync(skillIds)
    }

    console.log(`  ✓ Projects: ${projectsData.length}`)
  }

  // ───────────────────────────────────────────────────────────────────────────
  private async seedVotes() {
    const students = await User.query().whereHas('role', (q) => q.where('name', 'etudiant'))
    const projects = await Project.all()
    const projectIds = projects.map((p) => p.id)

    // Shuffle helper
    const shuffle = <T>(arr: T[]): T[] => arr.sort(() => Math.random() - 0.5)

    let totalVotes = 0
    for (const student of students) {
      await Vote.query().where('student_id', student.id).delete()

      // Each student votes for 2 or 3 random projects
      const count = Math.random() < 0.7 ? 3 : 2
      const picks = shuffle([...projectIds]).slice(0, count)

      for (let i = 0; i < picks.length; i++) {
        await Vote.create({
          studentId: student.id,
          projectId: picks[i],
          priority: (i + 1) as 1 | 2 | 3,
        })
        totalVotes++
      }
    }

    console.log(`  ✓ Votes: ${totalVotes} votes pour ${students.length} étudiants`)
  }
}
