import { test } from '@japa/runner'
import User from '#models/user'

// Helper : crée un token Bearer pour un utilisateur donné
async function tokenFor(email: string): Promise<string> {
  const user = await User.findByOrFail('email', email)
  const token = await User.accessTokens.create(user)
  return `Bearer ${token.value!.release()}`
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPÉTENCES
// ─────────────────────────────────────────────────────────────────────────────
test.group('Compétences — gestion d\'erreurs', (group) => {
  group.each.setup(async () => {
    // Les tests supposent que le seeder a été joué (migration:fresh --seed)
  })

  test('rejette une compétence en double (case-insensitive)', async ({ client, assert }) => {
    const token = await tokenFor('alice.doyen@eduvaud.ch')
    const res = await client.post('/api/skills').header('Authorization', token).json({ name: 'javascript' })
    assert.equal(res.status(), 409)
    assert.equal(res.body().error, 'SKILL_DUPLICATE')
  })

  test('rejette une compétence avec nom vide', async ({ client, assert }) => {
    const token = await tokenFor('alice.doyen@eduvaud.ch')
    const res = await client.post('/api/skills').header('Authorization', token).json({ name: '' })
    assert.equal(res.status(), 422)
  })

  test('rejette la fusion d\'une compétence avec elle-même', async ({ client, assert }) => {
    const token = await tokenFor('alice.doyen@eduvaud.ch')
    const listRes = await client.get('/api/skills').header('Authorization', token)
    const skills = listRes.body()
    if (skills.length < 1) return
    const skill = skills[0]
    const res = await client.post(`/api/skills/${skill.id}/merge`).header('Authorization', token).json({ secondarySkillId: skill.id })
    assert.equal(res.status(), 400)
    assert.equal(res.body().error, 'SAME_SKILL')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PROJETS
// ─────────────────────────────────────────────────────────────────────────────
test.group('Projets — gestion d\'erreurs', () => {
  test('rejette un titre vide', async ({ client, assert }) => {
    const token = await tokenFor('bob.martin@eduvaud.ch')
    const res = await client.post('/api/projects').header('Authorization', token)
      .json({ title: '', description: 'Description valide', skillIds: [1] })
    assert.equal(res.status(), 422)
  })

  test('rejette un titre supérieur à 30 caractères', async ({ client, assert }) => {
    const token = await tokenFor('bob.martin@eduvaud.ch')
    const res = await client.post('/api/projects').header('Authorization', token)
      .json({ title: 'Un titre vraiment bien trop long pour être valide', description: 'Description', skillIds: [1] })
    assert.equal(res.status(), 422)
  })

  test('rejette une description vide', async ({ client, assert }) => {
    const token = await tokenFor('bob.martin@eduvaud.ch')
    const res = await client.post('/api/projects').header('Authorization', token)
      .json({ title: 'Projet test', description: '', skillIds: [1] })
    assert.equal(res.status(), 422)
  })

  test('rejette une description supérieure à 350 caractères', async ({ client, assert }) => {
    const token = await tokenFor('bob.martin@eduvaud.ch')
    const res = await client.post('/api/projects').header('Authorization', token)
      .json({ title: 'Projet test', description: 'x'.repeat(351), skillIds: [1] })
    assert.equal(res.status(), 422)
  })

  test('rejette un tableau de technologies vide', async ({ client, assert }) => {
    const token = await tokenFor('bob.martin@eduvaud.ch')
    const res = await client.post('/api/projects').header('Authorization', token)
      .json({ title: 'Projet test', description: 'Description valide', skillIds: [] })
    assert.equal(res.status(), 422)
  })

  test('rejette plus de 20 technologies', async ({ client, assert }) => {
    const token = await tokenFor('bob.martin@eduvaud.ch')
    const res = await client.post('/api/projects').header('Authorization', token)
      .json({ title: 'Projet test', description: 'Description', skillIds: Array.from({ length: 21 }, (_, i) => i + 1) })
    assert.equal(res.status(), 422)
  })

  test('rejette un titre en double (case-insensitive)', async ({ client, assert }) => {
    const token = await tokenFor('bob.martin@eduvaud.ch')
    const listRes = await client.get('/api/projects').header('Authorization', token)
    const projects = listRes.body()
    if (projects.length === 0) return
    const existingTitle = projects[0].title
    const res = await client.post('/api/projects').header('Authorization', token)
      .json({ title: existingTitle, description: 'Autre description', skillIds: [1] })
    assert.equal(res.status(), 409)
    assert.equal(res.body().error, 'TITLE_TAKEN')
  })

  test('interdit à un professeur de modifier le projet d\'un autre', async ({ client, assert }) => {
    const tokenClaire = await tokenFor('claire.dupont@eduvaud.ch')
    // Chercher un projet qui appartient à Bob, pas à Claire
    const listRes = await client.get('/api/projects').header('Authorization', tokenClaire)
    const projects = listRes.body()
    const bobProject = projects.find((p: any) => p.professor.email !== 'claire.dupont@eduvaud.ch')
    if (!bobProject) return
    const res = await client.put(`/api/projects/${bobProject.id}`).header('Authorization', tokenClaire)
      .json({ title: 'Modification interdite' })
    assert.equal(res.status(), 403)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// VOTES
// ─────────────────────────────────────────────────────────────────────────────
test.group('Votes — gestion d\'erreurs', () => {
  test('rejette un 4ème vote (max 3)', async ({ client, assert }) => {
    const token = await tokenFor('emma.muller@eduvaud.ch')
    const votesRes = await client.get('/api/votes').header('Authorization', token)
    if (votesRes.body().length < 3) return

    const listRes = await client.get('/api/projects').header('Authorization', token)
    const votedIds = (votesRes.body() as any[]).map((v) => v.project.id)
    const unvoted = (listRes.body() as any[]).find((p: any) => !votedIds.includes(p.id))
    if (!unvoted) return

    const res = await client.post('/api/votes').header('Authorization', token)
      .json({ projectId: unvoted.id, priority: 1 })
    assert.equal(res.status(), 400)
    assert.equal(res.body().error, 'MAX_VOTES_REACHED')
  })

  test('rejette un vote en double pour le même projet', async ({ client, assert }) => {
    const token = await tokenFor('emma.muller@eduvaud.ch')
    const votesRes = await client.get('/api/votes').header('Authorization', token)
    const votes = votesRes.body()
    if (votes.length === 0) return
    const existingProjectId = votes[0].project.id
    const res = await client.post('/api/votes').header('Authorization', token)
      .json({ projectId: existingProjectId, priority: 1 })
    assert.equal(res.status(), 409)
    assert.equal(res.body().error, 'ALREADY_VOTED')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────
test.group('Permissions par rôle — erreurs', () => {
  test('un étudiant ne peut pas créer de projet', async ({ client, assert }) => {
    const token = await tokenFor('emma.muller@eduvaud.ch')
    const res = await client.post('/api/projects').header('Authorization', token)
      .json({ title: 'Projet etudiant', description: 'Description', skillIds: [1] })
    assert.equal(res.status(), 403)
  })

  test('un non-doyen ne peut pas changer l\'état', async ({ client, assert }) => {
    const token = await tokenFor('bob.martin@eduvaud.ch')
    const res = await client.put('/api/state').header('Authorization', token)
      .json({ newState: 'reperage' })
    assert.equal(res.status(), 403)
  })

  test('un non-doyen ne peut pas supprimer une compétence', async ({ client, assert }) => {
    const token = await tokenFor('bob.martin@eduvaud.ch')
    const listRes = await client.get('/api/skills').header('Authorization', token)
    const skills = listRes.body()
    if (!skills[0]) return
    const res = await client.delete(`/api/skills/${skills[0].id}`).header('Authorization', token)
    assert.equal(res.status(), 403)
  })

  test('une requête sans token est rejetée avec 401', async ({ client, assert }) => {
    const res = await client.get('/api/projects')
    assert.equal(res.status(), 401)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
test.group('Auth — gestion d\'erreurs', () => {
  test('rejette un token Azure invalide', async ({ client, assert }) => {
    const res = await client.post('/api/auth/azure').json({ accessToken: 'token_invalide_123' })
    assert.equal(res.status(), 401)
  })

  test('le bypass dev exige un email existant', async ({ client, assert }) => {
    const res = await client.post('/api/auth/dev-bypass').json({ email: 'inexistant@eduvaud.ch' })
    assert.oneOf(res.status(), [403, 404])
  })

  test('le bypass dev exige le champ email', async ({ client, assert }) => {
    const res = await client.post('/api/auth/dev-bypass').json({})
    assert.oneOf(res.status(), [400, 403])
  })
})
