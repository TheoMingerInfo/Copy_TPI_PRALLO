import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import RoleStatePermission from '#models/role_state_permission'

export type AppStateValue = 'preparation' | 'reperage' | 'vote' | 'repartition' | 'publication'

export default class State extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: AppStateValue

  @column()
  declare label: string

  @hasMany(() => RoleStatePermission, { foreignKey: 'stateId' })
  declare permissions: HasMany<typeof RoleStatePermission>
}
