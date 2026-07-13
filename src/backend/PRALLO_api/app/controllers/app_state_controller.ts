import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import AppState from '#models/app_state'
import State from '#models/state'
import type { AppStateValue } from '#models/state'
import Role from '#models/role'
import Project from '#models/project'
import User from '#models/user'
import Vote from '#models/vote'
import AllocationService from '#services/allocation_service'

const changeStateValidator = vine.compile(
  vine.object({
    newState: vine.enum(['preparation', 'reperage', 'vote', 'repartition', 'publication'] as const),
    confirmed: vine.boolean().optional(),
  })
)

export default class AppStateController {
  async show({ response }: HttpContext) {
    const appState = await AppState.current()
    return response.ok({ state: appState.state.name })
  }

  async change({ authUser, request, response }: HttpContext) {
    const user = authUser!
    const { newState, confirmed } = await changeStateValidator.validate(request.all())

    const current = await AppState.current()
    const warnings = await this.getTransitionWarnings(current.state.name, newState)

    if (warnings.length > 0 && !confirmed) {
      return response.ok({ requiresConfirmation: true, warnings, currentState: current.state.name, newState })
    }

    if (newState === 'preparation' && current.state.name === 'publication') {
      await this.resetAllData()
    }

    if (newState === 'reperage' && AppState.getOrder(current.state.name) > AppState.getOrder('reperage')) {
      await Vote.query().delete()
    }

    const newStateModel = await State.findByOrFail('name', newState)
    current.stateId = newStateModel.id
    current.updatedBy = user.id
    await current.save()
    await current.load('state')

    let allocationWarnings: string[] = []
    if (newState === 'repartition') {
      const result = await new AllocationService().calculate()
      allocationWarnings = result.warnings
    }

    return response.ok({
      state: current.state.name,
      message: `État changé vers "${newState}"`,
      warnings: allocationWarnings,
    })
  }

  private async getTransitionWarnings(from: string, to: AppStateValue): Promise<string[]> {
    const warnings: string[] = []

    if (to === 'reperage' && AppState.getOrder(from) < AppState.getOrder('reperage')) {
      const projectCount = await Project.query().count('* as total')
      if (Number((projectCount[0] as any).$extras.total) === 0) {
        warnings.push('La liste des projets est vide')
      }

      const etudiantProfIds = await Role.query()
        .whereIn('name', ['etudiant', 'professeur'])
        .select('id')
      const userCount = await User.query()
        .whereIn('role_id', etudiantProfIds.map((r) => r.id))
        .count('* as total')
      if (Number((userCount[0] as any).$extras.total) === 0) {
        warnings.push('La liste des participants est vide')
      }
    }

    if (to === 'vote') {
      const inviteRole = await Role.findByOrFail('name', 'invite')
      const inviteCount = await User.query()
        .where('role_id', inviteRole.id)
        .count('* as total')
      if (Number((inviteCount[0] as any).$extras.total) > 0) {
        warnings.push('Des comptes invités existent encore. Ils ne pourront pas voter.')
      }
    }

    if (to === 'repartition') {
      const mandatoryWithoutVotes = await Project.query()
        .where('is_mandatory', true)
        .whereDoesntHave('votes', (_q) => {})
      if (mandatoryWithoutVotes.length > 0) {
        warnings.push(`${mandatoryWithoutVotes.length} projet(s) obligatoire(s) sans aucun vote`)
      }

      const etudiantRole = await Role.findByOrFail('name', 'etudiant')

      const studentsWithoutVotes = await User.query()
        .where('role_id', etudiantRole.id)
        .whereDoesntHave('votes', (_q) => {})
      if (studentsWithoutVotes.length > 0) {
        const names = studentsWithoutVotes.map((u) => `${u.firstName} ${u.lastName}`).join(', ')
        warnings.push(`Élèves sans votes : ${names}`)
      }

      const studentCount = await User.query()
        .where('role_id', etudiantRole.id)
        .count('* as total')
      const totalStudents = Number((studentCount[0] as any).$extras.total)

      const projects = await Project.all()
      const totalSpots = projects.reduce((sum, p) => sum + (p.maxStudents ?? 1), 0)

      if (totalStudents > totalSpots) {
        warnings.push(`${totalStudents} élève(s) pour seulement ${totalSpots} place(s) — ${totalStudents - totalSpots} élève(s) ne pourront pas être affecté(s)`)
      } else if (totalSpots > totalStudents) {
        warnings.push(`${totalSpots} place(s) disponibles pour ${totalStudents} élève(s) — ${totalSpots - totalStudents} place(s) resteront vides`)
      }
    }

    if (to === 'reperage' && AppState.getOrder(from) > AppState.getOrder('reperage')) {
      warnings.push('Des votes existants seront supprimés lors du retour à Repérage')
    }

    if (to === 'publication') {
      warnings.push('Plus aucun changement ne sera possible après la publication')
    }

    if (to === 'preparation' && from === 'publication') {
      warnings.push('ATTENTION : Toutes les données (projets, votes, répartitions) seront supprimées')
    }

    return warnings
  }

  private async resetAllData(): Promise<void> {
    await db.from('allocations').delete()
    await db.from('votes').delete()
    await db.from('project_skills').delete()
    await db.from('project_files').delete()
    await db.from('projects').delete()
  }
}
