import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role from '#models/role'
import State from '#models/state'
import AppState from '#models/app_state'
import RoleStatePermission from '#models/role_state_permission'
import type { Permissions } from '#models/role_state_permission'
import type { AppStateValue } from '#models/state'
import type { UserRole } from '#models/role'

const off: Permissions = {
  accessSite: false, viewProjects: false, createProject: false,
  editOwnProject: false, deleteOwnProject: false, editAnyProject: false, deleteAnyProject: false,
  viewSkills: false, createSkill: false, deleteSkill: false, mergeSkills: false,
  manageOwnSkills: false, viewParticipants: false, editParticipants: false,
  vote: false, viewOwnVotes: false, viewAllVotes: false,
  viewAllocation: false, editAllocation: false, changeState: false,
  setMandatory: false, viewSatisfactionIndex: false,
}

const matrix: Record<UserRole, Record<AppStateValue, Partial<Permissions>>> = {
  doyen: {
    preparation: {
      accessSite: true, viewProjects: true, createProject: true, editOwnProject: true,
      editAnyProject: true, deleteOwnProject: true, deleteAnyProject: true,
      viewSkills: true, createSkill: true, deleteSkill: true, mergeSkills: true,
      viewParticipants: true, editParticipants: true, changeState: true, setMandatory: true,
    },
    reperage: {
      accessSite: true, viewProjects: true, viewSkills: true, viewParticipants: true,
      editParticipants: true, changeState: true, viewAllVotes: true,
    },
    vote: {
      accessSite: true, viewProjects: true, createProject: true, editAnyProject: true, deleteAnyProject: true,
      viewSkills: true, createSkill: true, deleteSkill: true, mergeSkills: true,
      viewParticipants: true, editParticipants: true, viewAllVotes: true, changeState: true,
      setMandatory: true,
    },
    repartition: {
      accessSite: true, viewProjects: true, editAnyProject: true, deleteAnyProject: true,
      viewSkills: true, viewParticipants: true, viewAllVotes: true,
      viewAllocation: true, editAllocation: true, changeState: true,
      viewSatisfactionIndex: true,
    },
    publication: {
      accessSite: true, viewProjects: true, viewSkills: true, viewParticipants: true,
      viewAllocation: true, changeState: true,
    },
  },
  professeur: {
    preparation: {
      accessSite: true, viewProjects: true, createProject: true, editOwnProject: true, deleteOwnProject: true,
      viewSkills: true, createSkill: true, manageOwnSkills: true,
    },
    reperage: {
      accessSite: true, viewProjects: true, createProject: true, editOwnProject: true, deleteOwnProject: true,
      viewSkills: true, createSkill: true, manageOwnSkills: true,
    },
    vote: {
      accessSite: true, viewProjects: true, createProject: true, editOwnProject: true,
      viewSkills: true, createSkill: true, manageOwnSkills: true, viewAllVotes: true,
    },
    repartition: {
      accessSite: true, viewProjects: true, viewSkills: true, viewAllocation: true,
    },
    publication: {
      accessSite: true, viewProjects: true, viewSkills: true, viewAllocation: true,
    },
  },
  etudiant: {
    preparation: {},
    reperage: { accessSite: true, viewProjects: true},
    vote: {
      accessSite: true, viewProjects: true,
      vote: true, viewOwnVotes: true,
    },
    repartition: { accessSite: true, viewProjects: true, viewAllocation: true },
    publication: {
      accessSite: true, viewProjects: true, viewAllocation: true,
    },
  },
  invite: {
    preparation: {},
    reperage: {accessSite: true, viewProjects: true},
    vote: {},
    repartition: {},
    publication: {},
  },
}

export default class PermissionsSeeder extends BaseSeeder {
  async run() {
    console.log('🔐 Seeding roles, states & permissions...')

    // Rôles
    const roleData: { name: UserRole; label: string }[] = [
      { name: 'doyen', label: 'Doyen' },
      { name: 'professeur', label: 'Professeur' },
      { name: 'etudiant', label: 'Étudiant' },
      { name: 'invite', label: 'Invité' },
    ]
    for (const r of roleData) {
      await Role.updateOrCreate({ name: r.name }, r)
    }

    // États
    const stateData: { name: AppStateValue; label: string }[] = [
      { name: 'preparation', label: 'Préparation' },
      { name: 'reperage', label: 'Repérage' },
      { name: 'vote', label: 'Vote' },
      { name: 'repartition', label: 'Répartition' },
      { name: 'publication', label: 'Publication' },
    ]
    for (const s of stateData) {
      await State.updateOrCreate({ name: s.name }, s)
    }

    // AppState initial
    const preparation = await State.findByOrFail('name', 'preparation')
    await AppState.updateOrCreate({ id: 1 }, { id: 1, stateId: preparation.id })

    // Permissions
    const roles = await Role.all()
    const states = await State.all()
    const getRoleId = (name: UserRole) => roles.find((r) => r.name === name)!.id
    const getStateId = (name: AppStateValue) => states.find((s) => s.name === name)!.id

    let count = 0
    for (const role of Object.keys(matrix) as UserRole[]) {
      for (const state of Object.keys(matrix[role]) as AppStateValue[]) {
        const perms: Permissions = { ...off, ...matrix[role][state] }
        await RoleStatePermission.updateOrCreate(
          { roleId: getRoleId(role), stateId: getStateId(state) },
          { permissions: perms }
        )
        count++
      }
    }

    console.log(`  ✓ ${roleData.length} rôles | ${stateData.length} états | ${count} permissions`)
  }
}
