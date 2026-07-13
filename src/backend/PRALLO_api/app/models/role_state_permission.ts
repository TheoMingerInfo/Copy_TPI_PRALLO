import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Role from '#models/role'
import State from '#models/state'

export interface Permissions {
  accessSite: boolean
  viewProjects: boolean
  createProject: boolean
  editOwnProject: boolean
  deleteOwnProject: boolean
  editAnyProject: boolean
  deleteAnyProject: boolean
  viewSkills: boolean
  createSkill: boolean
  deleteSkill: boolean
  mergeSkills: boolean
  manageOwnSkills: boolean
  viewParticipants: boolean
  editParticipants: boolean
  vote: boolean
  viewOwnVotes: boolean
  viewAllVotes: boolean
  viewAllocation: boolean
  editAllocation: boolean
  changeState: boolean
  setMandatory: boolean
  viewSatisfactionIndex: boolean
}

export default class RoleStatePermission extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare roleId: number

  @column()
  declare stateId: number

  @column({
    prepare: (v: Permissions) => JSON.stringify(v),
    consume: (v: string) => (typeof v === 'string' ? JSON.parse(v) : v),
  })
  declare permissions: Permissions

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Role, { foreignKey: 'roleId' })
  declare role: BelongsTo<typeof Role>

  @belongsTo(() => State, { foreignKey: 'stateId' })
  declare state: BelongsTo<typeof State>

  static async getPermissions(roleId: number, stateName: string): Promise<Permissions | null> {
    const record = await RoleStatePermission.query()
      .join('states', 'role_state_permissions.state_id', 'states.id')
      .where('role_state_permissions.role_id', roleId)
      .where('states.name', stateName)
      .select('role_state_permissions.*')
      .first()
    return record?.permissions ?? null
  }
}
