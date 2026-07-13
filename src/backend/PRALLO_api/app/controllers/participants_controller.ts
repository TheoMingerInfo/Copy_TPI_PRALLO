import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import User from '#models/user'
import Role from '#models/role'
import '#types/http_context'

const updateRoleValidator = vine.compile(
  vine.object({ role: vine.enum(['doyen', 'professeur', 'etudiant', 'invite'] as const) })
)

const updateMaxProjectsValidator = vine.compile(
  vine.object({ maxProjects: vine.number().min(1) })
)

const updateSkillsValidator = vine.compile(
  vine.object({ skillIds: vine.array(vine.number()) })
)

export default class ParticipantsController {
  async index({ response }: HttpContext) {
    const users = await User.query().preload('skills').preload('role').orderBy('last_name', 'asc')

    return response.ok(
      users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role.name,
        maxProjects: u.maxProjects,
        skills: u.skills.map((s) => ({ id: s.id, name: s.name })),
      }))
    )
  }

  async updateRole({ params, request, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const { role } = await updateRoleValidator.validate(request.all())

    const roleModel = await Role.findByOrFail('name', role)
    user.roleId = roleModel.id

    if (role !== 'professeur' && role !== 'doyen') {
      user.maxProjects = null
    } else if (user.maxProjects === null) {
      user.maxProjects = 1
    }

    await user.save()
    return response.ok({ id: user.id, role, maxProjects: user.maxProjects })
  }

  async updateMaxProjects({ params, request, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.load('role')

    if (user.role.name !== 'professeur' && user.role.name !== 'doyen') {
      return response.badRequest({ error: 'INVALID_ROLE', message: 'Seuls les professeurs et doyens ont un nombre de projets' })
    }

    const { maxProjects } = await updateMaxProjectsValidator.validate(request.all())
    user.maxProjects = maxProjects
    await user.save()

    return response.ok({ id: user.id, maxProjects: user.maxProjects })
  }

  async updateSkills({ authUser, params, request, response, permissions }: HttpContext) {
    const currentUser = authUser!
    const targetUser = await User.findOrFail(params.id)

    if (!permissions?.editParticipants && currentUser.id !== targetUser.id) {
      return response.forbidden({ error: 'FORBIDDEN', message: 'Vous ne pouvez modifier que vos propres compétences' })
    }

    const { skillIds } = await updateSkillsValidator.validate(request.all())
    await targetUser.related('skills').sync(skillIds)
    await targetUser.load('skills')

    return response.ok({
      id: targetUser.id,
      skills: targetUser.skills.map((s) => ({ id: s.id, name: s.name })),
    })
  }
}
