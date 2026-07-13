import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import RoleStatePermission from '#models/role_state_permission'

export type UserRole = 'doyen' | 'professeur' | 'etudiant' | 'invite'

export default class Role extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: UserRole

  @column()
  declare label: string

  @hasMany(() => User, { foreignKey: 'roleId' })
  declare users: HasMany<typeof User>

  @hasMany(() => RoleStatePermission, { foreignKey: 'roleId' })
  declare permissions: HasMany<typeof RoleStatePermission>
}
