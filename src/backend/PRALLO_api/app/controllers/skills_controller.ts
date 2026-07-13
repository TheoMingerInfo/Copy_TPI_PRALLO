import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import Skill from '#models/skill'

const createSkillValidator = vine.compile(
  vine.object({ name: vine.string().trim().minLength(1).maxLength(100) })
)

const mergeSkillValidator = vine.compile(
  vine.object({ secondarySkillId: vine.number() })
)

export default class SkillsController {
  async index({ response }: HttpContext) {
    const skills = await Skill.query().orderBy('name', 'asc')
    return response.ok(skills.map((s) => ({ id: s.id, name: s.name })))
  }

  async store({ request, response }: HttpContext) {
    const { name } = await createSkillValidator.validate(request.all())

    const duplicate = await Skill.findDuplicate(name)
    if (duplicate) {
      return response.conflict({ error: 'SKILL_DUPLICATE', message: `La compétence "${duplicate.name}" existe déjà` })
    }

    const skill = await Skill.create({ name: name.trim() })
    return response.created({ id: skill.id, name: skill.name })
  }

  async destroy({ params, response }: HttpContext) {
    const skill = await Skill.findOrFail(params.id)
    await skill.delete()
    return response.ok({ message: 'Compétence supprimée' })
  }

  async merge({ params, request, response }: HttpContext) {
    const primarySkill = await Skill.findOrFail(params.id)
    const { secondarySkillId } = await mergeSkillValidator.validate(request.all())

    if (primarySkill.id === secondarySkillId) {
      return response.badRequest({ error: 'SAME_SKILL', message: 'Impossible de fusionner une compétence avec elle-même' })
    }

    const secondarySkill = await Skill.findOrFail(secondarySkillId)

    // Migrer toutes les relations project_skills du secondaire vers le primaire
    const projectRowsWithPrimary = await db
      .from('project_skills')
      .where('skill_id', primarySkill.id)
      .select('project_id')

    const projectIdsWithPrimary = projectRowsWithPrimary.map((r: any) => r.project_id)

    await db
      .from('project_skills')
      .where('skill_id', secondarySkill.id)
      .whereNotIn('project_id', projectIdsWithPrimary.length > 0 ? projectIdsWithPrimary : [0])
      .update({ skill_id: primarySkill.id })

    // Migrer toutes les relations user_skills
    const userRowsWithPrimary = await db
      .from('user_skills')
      .where('skill_id', primarySkill.id)
      .select('user_id')

    const userIdsWithPrimary = userRowsWithPrimary.map((r: any) => r.user_id)

    await db
      .from('user_skills')
      .where('skill_id', secondarySkill.id)
      .whereNotIn('user_id', userIdsWithPrimary.length > 0 ? userIdsWithPrimary : [0])
      .update({ skill_id: primarySkill.id })

    await secondarySkill.delete()

    return response.ok({
      message: `"${primarySkill.name}" et "${secondarySkill.name}" ont été fusionnées`,
      skill: { id: primarySkill.id, name: primarySkill.name },
    })
  }
}
