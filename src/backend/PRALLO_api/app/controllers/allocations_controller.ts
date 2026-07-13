import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Allocation from '#models/allocation'
import Vote from '#models/vote'
import AllocationService from '#services/allocation_service'

const updateAllocationValidator = vine.compile(
  vine.object({
    studentId: vine.number().nullable().optional(),
    professorId: vine.number().optional(),
  })
)

export default class AllocationsController {
  async index({ response }: HttpContext) {
    const allocations = await Allocation.query()
      .preload('project', (q) => q.preload('skills'))
      .preload('student')
      .preload('professor')
      .orderBy('id', 'asc')

    return response.ok(
      allocations.map((a) => ({
        id: a.id,
        isUnassigned: a.isUnassigned,
        project: { id: a.project.id, title: a.project.title, isMandatory: a.project.isMandatory },
        student: a.student ? { id: a.student.id, firstName: a.student.firstName, lastName: a.student.lastName } : null,
        professor: { id: a.professor.id, firstName: a.professor.firstName, lastName: a.professor.lastName },
      }))
    )
  }

  async show({ params, response }: HttpContext) {
    const allocation = await Allocation.query()
      .where('project_id', params.projectId)
      .preload('project', (q) => q.preload('skills'))
      .preload('student')
      .preload('professor')
      .firstOrFail()

    return response.ok({
      id: allocation.id,
      isUnassigned: allocation.isUnassigned,
      project: { id: allocation.project.id, title: allocation.project.title },
      student: allocation.student ? { id: allocation.student.id, firstName: allocation.student.firstName, lastName: allocation.student.lastName } : null,
      professor: { id: allocation.professor.id, firstName: allocation.professor.firstName, lastName: allocation.professor.lastName },
    })
  }

  async update({ params, request, response }: HttpContext) {
    const allocation = await Allocation.query().where('project_id', params.projectId).firstOrFail()
    const data = await updateAllocationValidator.validate(request.all())

    if (data.studentId !== undefined) allocation.studentId = data.studentId
    if (data.professorId !== undefined) allocation.professorId = data.professorId

    await allocation.save()
    return response.ok({ id: allocation.id, studentId: allocation.studentId, professorId: allocation.professorId })
  }

  /**
   * POST /api/allocations/calculate
   * Calcule la répartition optimale selon les votes et compétences.
   */
  async calculate({ response }: HttpContext) {
    const service = new AllocationService()
    const result = await service.calculate()
    return response.ok(result)
  }

  /**
   * GET /api/allocations/satisfaction
   * Calcule l'indice de satisfaction : pour chaque étudiant assigné, vérifie
   * si son projet correspond à son 1er, 2ème, 3ème choix ou à aucun vote.
   * Score : 1er choix = 3pts, 2ème = 2pts, 3ème = 1pt, non voté = 0pt.
   */
  async satisfaction({ response }: HttpContext) {
    const allocations = await Allocation.query()
      .whereNotNull('student_id')
      .where('is_unassigned', false)

    const votes = await Vote.query()

    let firstChoice = 0
    let secondChoice = 0
    let thirdChoice = 0
    let noVote = 0

    for (const alloc of allocations) {
      if (!alloc.studentId) continue
      const vote = votes.find(
        (v) => v.studentId === alloc.studentId && v.projectId === alloc.projectId
      )
      if (!vote) { noVote++; continue }
      if (vote.priority === 1) firstChoice++
      else if (vote.priority === 2) secondChoice++
      else thirdChoice++
    }

    const assigned = allocations.filter((a) => a.studentId).length
    const score = firstChoice * 3 + secondChoice * 2 + thirdChoice * 1
    const maxScore = assigned * 3
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

    return response.ok({ percentage, assigned, firstChoice, secondChoice, thirdChoice, noVote })
  }
}
