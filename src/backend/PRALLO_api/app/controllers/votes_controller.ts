import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Vote from '#models/vote'
import db from '@adonisjs/lucid/services/db'

const createVoteValidator = vine.compile(
  vine.object({
    projectId: vine.number(),
    priority: vine.number().in([1, 2, 3]),
  })
)

const reorderVotesValidator = vine.compile(
  vine.object({
    updates: vine.array(
      vine.object({
        id: vine.number(),
        priority: vine.number().in([1, 2, 3]),
      })
    ),
  })
)

export default class VotesController {
  async index({ authUser, response }: HttpContext) {
    const user = authUser!
    const votes = await Vote.query()
      .where('student_id', user.id)
      .preload('project', (q) => q.preload('professor').preload('skills'))
      .orderBy('priority', 'asc')

    return response.ok(
      votes.map((v) => ({
        id: v.id,
        priority: v.priority,
        project: {
          id: v.project.id,
          title: v.project.title,
          description: v.project.description,
          isMandatory: v.project.isMandatory,
          professor: {
            id: v.project.professor.id,
            firstName: v.project.professor.firstName,
            lastName: v.project.professor.lastName,
          },
          skills: v.project.skills.map((s) => ({ id: s.id, name: s.name })),
        },
      }))
    )
  }

  async store({ authUser, request, response }: HttpContext) {
    const user = authUser!
    const { projectId, priority } = await createVoteValidator.validate(request.all())

    const existingVoteCount = await Vote.countForStudent(user.id)
    if (existingVoteCount >= 3) {
      return response.badRequest({ error: 'MAX_VOTES_REACHED', message: 'Vous avez déjà voté pour 3 projets' })
    }

    const alreadyVoted = await Vote.query().where('student_id', user.id).where('project_id', projectId).first()
    if (alreadyVoted) {
      return response.conflict({ error: 'ALREADY_VOTED', message: 'Vous avez déjà voté pour ce projet' })
    }

    const priorityTaken = await Vote.query().where('student_id', user.id).where('priority', priority).first()
    if (priorityTaken) {
      return response.conflict({ error: 'PRIORITY_TAKEN', message: `La priorité ${priority} est déjà utilisée` })
    }

    const vote = await Vote.create({ studentId: user.id, projectId, priority: priority as 1 | 2 | 3 })

    return response.created({ id: vote.id, projectId: vote.projectId, priority: vote.priority })
  }

  async destroy({ authUser, params, response }: HttpContext) {
    const user = authUser!
    const vote = await Vote.query().where('id', params.id).where('student_id', user.id).firstOrFail()

    const removedPriority = vote.priority
    await vote.delete()

    await Vote.reorderAfterRemoval(user.id, removedPriority)

    return response.ok({ message: 'Vote supprimé et priorités réordonnées' })
  }

  async reorder({ authUser, request, response }: HttpContext) {
    const user = authUser!
    const { updates } = await reorderVotesValidator.validate(request.all())

    const ids = updates.map((u) => u.id)

    // Verify all IDs belong to this student
    const count = await Vote.query()
      .where('student_id', user.id)
      .whereIn('id', ids)
      .count('* as total')
    if (Number((count[0] as any).$extras.total) !== ids.length) {
      return response.badRequest({ message: 'Certains votes sont invalides.' })
    }

    // Two-phase update in a transaction to avoid unique constraint conflicts.
    // MySQL checks (student_id, priority) uniqueness row-by-row, so we first move
    // all priorities to neutral values (10+) before setting the real ones.
    await db.transaction(async (trx) => {
      for (const update of updates) {
        await trx.rawQuery(
          'UPDATE votes SET priority = ? WHERE id = ? AND student_id = ?',
          [10 + update.priority, update.id, user.id]
        )
      }
      for (const update of updates) {
        await trx.rawQuery(
          'UPDATE votes SET priority = ? WHERE id = ? AND student_id = ?',
          [update.priority, update.id, user.id]
        )
      }
    })

    return response.ok({ message: 'Priorités mises à jour.' })
  }
}
