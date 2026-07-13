import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Project from '#models/project'
import Allocation from '#models/allocation'
import AppState from '#models/app_state'

const createProjectValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(30),
    description: vine.string().trim().minLength(1).maxLength(350),
    skillIds: vine.array(vine.number()).minLength(1).maxLength(20),
    isMandatory: vine.boolean().optional(),
    maxStudents: vine.number().min(1).optional(),
  })
)

const updateProjectValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(1).maxLength(30).optional(),
    description: vine.string().trim().minLength(1).maxLength(350).optional(),
    skillIds: vine.array(vine.number()).minLength(1).maxLength(20).optional(),
    isMandatory: vine.boolean().optional(),
    maxStudents: vine.number().min(1).optional(),
  })
)

export default class ProjectsController {
  async index({ request, response }: HttpContext) {
    const { search, skillIds } = request.qs()

    const query = Project.query().preload('professor').preload('skills').preload('files')

    if (search) {
      query.where((q) => {
        q.whereILike('title', `%${search}%`).orWhereILike('description', `%${search}%`)
      })
    }

    if (skillIds) {
      const ids: number[] = Array.isArray(skillIds) ? skillIds : [skillIds]
      query.whereHas('skills', (q) => q.whereIn('skills.id', ids))
    }

    const projects = await query.orderBy('created_at', 'desc')

    const state = await AppState.currentState()
    const withVotes = ['vote', 'repartition', 'publication'].includes(state)

    const data = await Promise.all(
      projects.map(async (p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        isMandatory: p.isMandatory,
        maxStudents: p.maxStudents,
        professor: { id: p.professor.id, firstName: p.professor.firstName, lastName: p.professor.lastName },
        skills: p.skills.map((s) => ({ id: s.id, name: s.name })),
        hasFiles: p.files.length > 0,
        voteCount: withVotes ? await p.getVoteCount() : undefined,
      }))
    )

    return response.ok(data)
  }

  async show({ params, response }: HttpContext) {
    const project = await Project.query()
      .where('id', params.id)
      .preload('professor')
      .preload('skills')
      .preload('files')
      .firstOrFail()

    const state = await AppState.currentState()
    const withVotes = ['vote', 'repartition', 'publication'].includes(state)

    return response.ok({
      id: project.id,
      title: project.title,
      description: project.description,
      isMandatory: project.isMandatory,
      maxStudents: project.maxStudents,
      professor: { id: project.professor.id, firstName: project.professor.firstName, lastName: project.professor.lastName },
      skills: project.skills.map((s) => ({ id: s.id, name: s.name })),
      files: project.files.map((f) => ({ id: f.id, fileName: f.fileName, mimeType: f.mimeType, fileSize: f.fileSize })),
      voteCount: withVotes ? await project.getVoteCount() : undefined,
    })
  }

  async store({ authUser, request, response }: HttpContext) {
    const user = authUser!
    const data = await createProjectValidator.validate(request.all())

    const isTaken = await Project.isTitleTaken(data.title)
    if (isTaken) {
      return response.conflict({ error: 'TITLE_TAKEN', message: 'Un projet avec ce titre existe déjà' })
    }

    const project = await Project.create({
      title: data.title,
      description: data.description,
      professorId: user.id,
      isMandatory: data.isMandatory ?? false,
      maxStudents: data.maxStudents ?? 1,
    })

    if (data.skillIds && data.skillIds.length > 0) {
      await project.related('skills').sync(data.skillIds)
    }

    await project.load('skills')
    await project.load('professor')

    return response.created({
      id: project.id,
      title: project.title,
      description: project.description,
      isMandatory: project.isMandatory,
      maxStudents: project.maxStudents,
      professor: { id: project.professor.id, firstName: project.professor.firstName, lastName: project.professor.lastName },
      skills: project.skills.map((s) => ({ id: s.id, name: s.name })),
    })
  }

  async update({ authUser, params, request, response, permissions }: HttpContext) {
    const user = authUser!
    const project = await Project.findOrFail(params.id)

    if (!permissions?.editAnyProject && project.professorId !== user.id) {
      return response.forbidden({ error: 'FORBIDDEN', message: 'Vous ne pouvez modifier que vos propres projets' })
    }

    const data = await updateProjectValidator.validate(request.all())

    if (data.title && data.title !== project.title) {
      const isTaken = await Project.isTitleTaken(data.title, project.id)
      if (isTaken) {
        return response.conflict({ error: 'TITLE_TAKEN', message: 'Un projet avec ce titre existe déjà' })
      }
    }

    if (data.title !== undefined) project.title = data.title
    if (data.description !== undefined) project.description = data.description
    if (data.isMandatory !== undefined) project.isMandatory = data.isMandatory
    if (data.maxStudents !== undefined) project.maxStudents = data.maxStudents

    await project.save()

    if (data.skillIds !== undefined) {
      await project.related('skills').sync(data.skillIds)
    }

    await project.load('skills')
    await project.load('professor')

    return response.ok({
      id: project.id,
      title: project.title,
      description: project.description,
      isMandatory: project.isMandatory,
      maxStudents: project.maxStudents,
      professor: { id: project.professor.id, firstName: project.professor.firstName, lastName: project.professor.lastName },
      skills: project.skills.map((s) => ({ id: s.id, name: s.name })),
    })
  }

  async destroy({ authUser, params, response, permissions }: HttpContext) {
    const user = authUser!
    const project = await Project.findOrFail(params.id)

    if (!permissions?.deleteAnyProject && project.professorId !== user.id) {
      return response.forbidden({ error: 'FORBIDDEN', message: 'Vous ne pouvez supprimer que vos propres projets' })
    }

    const state = await AppState.currentState()

    if (state === 'repartition') {
      await Allocation.query().where('project_id', project.id).update({ isUnassigned: true, studentId: null })
    }

    await project.delete()
    return response.ok({ message: 'Projet supprimé' })
  }
}
