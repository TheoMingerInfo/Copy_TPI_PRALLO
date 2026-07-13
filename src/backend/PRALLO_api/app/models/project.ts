import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Skill from '#models/skill'
import ProjectFile from '#models/project_file'
import Vote from '#models/vote'
import Allocation from '#models/allocation'

export default class Project extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare professorId: number

  @column()
  declare isMandatory: boolean

  @column()
  declare maxStudents: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'professorId' })
  declare professor: BelongsTo<typeof User>

  @manyToMany(() => Skill, { pivotTable: 'project_skills' })
  declare skills: ManyToMany<typeof Skill>

  @hasMany(() => ProjectFile)
  declare files: HasMany<typeof ProjectFile>

  @hasMany(() => Vote)
  declare votes: HasMany<typeof Vote>

  @hasMany(() => Allocation)
  declare allocations: HasMany<typeof Allocation>

  static async isTitleTaken(title: string, excludeId?: number): Promise<boolean> {
    const query = Project.query().whereRaw('LOWER(title) = LOWER(?)', [title])
    if (excludeId) {
      query.whereNot('id', excludeId)
    }
    const result = await query.first()
    return result !== null
  }

  async getVoteCount(): Promise<number> {
    const result = await Vote.query().where('project_id', this.id).count('* as total')
    return Number((result[0] as any).$extras.total)
  }
}
