import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Skill extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @manyToMany(() => User, { pivotTable: 'user_skills' })
  declare users: ManyToMany<typeof User>

  static normalizedName(name: string): string {
    return name.trim().toLowerCase()
  }

  static async findDuplicate(name: string, excludeId?: number): Promise<Skill | null> {
    const query = Skill.query().whereRaw('LOWER(name) = ?', [Skill.normalizedName(name)])
    if (excludeId) {
      query.whereNot('id', excludeId)
    }
    return query.first()
  }
}
