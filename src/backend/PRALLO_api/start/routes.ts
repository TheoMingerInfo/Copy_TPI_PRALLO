import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// ── Auth/me — azureAuth seulement (pas siteAccess, besoin même si accessSite=false) ──
router
  .group(() => {
    router.get('/auth/me', '#controllers/auth_controller.me')
    router.post('/auth/logout', '#controllers/auth_controller.logout')
  })
  .prefix('/api')
  .use([middleware.azureAuth()])

// ── Routes protégées (azureAuth + siteAccess) ────────────────────────────────
router
  .group(() => {
    // État de l'application
    router.get('/state', '#controllers/app_state_controller.show')
    router
      .put('/state', '#controllers/app_state_controller.change')
      .use(middleware.checkPermission({ permission: 'changeState' }))

    // Projets
    router
      .get('/projects', '#controllers/projects_controller.index')
      .use(middleware.checkPermission({ permission: 'viewProjects' }))
    router
      .get('/projects/:id', '#controllers/projects_controller.show')
      .use(middleware.checkPermission({ permission: 'viewProjects' }))
    router
      .post('/projects', '#controllers/projects_controller.store')
      .use(middleware.checkPermission({ permission: 'createProject' }))
    router
      .put('/projects/:id', '#controllers/projects_controller.update')
      .use(middleware.checkPermission({ permission: ['editOwnProject', 'editAnyProject'] }))
    router
      .delete('/projects/:id', '#controllers/projects_controller.destroy')
      .use(middleware.checkPermission({ permission: ['deleteOwnProject', 'deleteAnyProject'] }))

    // Fichiers de projets
    router.post('/projects/:id/files', '#controllers/project_files_controller.store')
    router.delete('/projects/:id/files/:fileId', '#controllers/project_files_controller.destroy')
    router
      .get('/projects/:id/files/:fileId/download', '#controllers/project_files_controller.download')
      .use(middleware.checkPermission({ permission: 'viewProjects' }))

    // Compétences
    router
      .get('/skills', '#controllers/skills_controller.index')
      .use(middleware.checkPermission({ permission: 'viewSkills' }))
    router
      .post('/skills', '#controllers/skills_controller.store')
      .use(middleware.checkPermission({ permission: 'createSkill' }))
    router
      .delete('/skills/:id', '#controllers/skills_controller.destroy')
      .use(middleware.checkPermission({ permission: 'deleteSkill' }))
    router
      .post('/skills/:id/merge', '#controllers/skills_controller.merge')
      .use(middleware.checkPermission({ permission: 'mergeSkills' }))

    // Votes
    router
      .get('/votes', '#controllers/votes_controller.index')
      .use(middleware.checkPermission({ permission: 'viewOwnVotes' }))
    router
      .post('/votes', '#controllers/votes_controller.store')
      .use(middleware.checkPermission({ permission: 'vote' }))
    router
      .put('/votes/reorder', '#controllers/votes_controller.reorder')
      .use(middleware.checkPermission({ permission: 'vote' }))
    router
      .delete('/votes/:id', '#controllers/votes_controller.destroy')
      .use(middleware.checkPermission({ permission: 'vote' }))

    // Participants
    router
      .get('/participants', '#controllers/participants_controller.index')
      .use(middleware.checkPermission({ permission: 'viewParticipants' }))
    router
      .put('/participants/:id/role', '#controllers/participants_controller.updateRole')
      .use(middleware.checkPermission({ permission: 'editParticipants' }))
    router
      .put('/participants/:id/max-projects', '#controllers/participants_controller.updateMaxProjects')
      .use(middleware.checkPermission({ permission: 'editParticipants' }))
    router
      .put('/participants/:id/skills', '#controllers/participants_controller.updateSkills')
      .use(middleware.checkPermission({ permission: 'manageOwnSkills' }))

    // Répartitions
    router
      .get('/allocations', '#controllers/allocations_controller.index')
      .use(middleware.checkPermission({ permission: 'viewAllocation' }))
    router
      .get('/allocations/satisfaction', '#controllers/allocations_controller.satisfaction')
      .use(middleware.checkPermission({ permission: 'viewSatisfactionIndex' }))
    router
      .post('/allocations/calculate', '#controllers/allocations_controller.calculate')
      .use(middleware.checkPermission({ permission: 'editAllocation' }))
    router
      .get('/allocations/:projectId', '#controllers/allocations_controller.show')
      .use(middleware.checkPermission({ permission: 'viewAllocation' }))
    router
      .put('/allocations/:projectId', '#controllers/allocations_controller.update')
      .use(middleware.checkPermission({ permission: 'editAllocation' }))
  })
  .prefix('/api')
  .use([middleware.azureAuth(), middleware.siteAccess()])
