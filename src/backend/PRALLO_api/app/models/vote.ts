import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Project from '#models/project'

export default class Vote extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare studentId: number

  @column()
  declare projectId: number

  @column()
  declare priority: 1 | 2 | 3

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'studentId' })
  declare student: BelongsTo<typeof User>

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  static async countForStudent(studentId: number): Promise<number> {
    const result = await Vote.query().where('student_id', studentId).count('* as total')
    return Number((result[0] as any).$extras.total)
  }

  static async reorderAfterRemoval(studentId: number, removedPriority: number): Promise<void> {
    await Vote.query()
      .where('student_id', studentId)
      .where('priority', '>', removedPriority)
      .decrement('priority', 1)
  }
}
