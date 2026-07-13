import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { ManyToMany, HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import Role from '#models/role'
import Skill from '#models/skill'
import Vote from '#models/vote'
import Allocation from '#models/allocation'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare firstName: string

  @column()
  declare lastName: string

  @column()
  declare email: string

  @column()
  declare azureId: string | null

  @column()
  declare roleId: number

  @column()
  declare maxProjects: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)

  @belongsTo(() => Role, { foreignKey: 'roleId' })
  declare role: BelongsTo<typeof Role>

  @manyToMany(() => Skill, { pivotTable: 'user_skills' })
  declare skills: ManyToMany<typeof Skill>

  @hasMany(() => Vote, { foreignKey: 'studentId' })
  declare votes: HasMany<typeof Vote>

  @hasMany(() => Allocation, { foreignKey: 'studentId' })
  declare allocations: HasMany<typeof Allocation>

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`
  }

  isProfesseurOrDoyen(): boolean {
    return this.role?.name === 'professeur' || this.role?.name === 'doyen'
  }

  canEncadrerMoreProjects(currentCount: number): boolean {
    if (!this.isProfesseurOrDoyen()) return false
    if (this.maxProjects === null) return false
    return currentCount < this.maxProjects
  }
}
