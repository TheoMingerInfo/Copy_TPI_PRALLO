import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'
import State from '#models/state'
import type { AppStateValue } from '#models/state'

export type { AppStateValue }

const STATE_ORDER: AppStateValue[] = [
  'preparation',
  'reperage',
  'vote',
  'repartition',
  'publication',
]

export default class AppState extends BaseModel {
  static selfAssignPrimaryKey = true
  static table = 'app_state'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare stateId: number

  @column()
  declare updatedBy: number | null

  @column.dateTime({ autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => State, { foreignKey: 'stateId' })
  declare state: BelongsTo<typeof State>

  @belongsTo(() => User, { foreignKey: 'updatedBy' })
  declare updatedByUser: BelongsTo<typeof User>

  static async current(): Promise<AppState> {
    let appState = await AppState.query().preload('state').where('id', 1).first()
    if (!appState) {
      const prepState = await State.findByOrFail('name', 'preparation')
      appState = await AppState.create({ id: 1, stateId: prepState.id })
      await appState.load('state')
    }
    return appState
  }

  static async currentState(): Promise<AppStateValue> {
    const s = await AppState.current()
    return s.state.name
  }

  static getOrder(stateName: string): number {
    return STATE_ORDER.indexOf(stateName as AppStateValue)
  }

  static isValidTransition(_from: AppStateValue, _to: AppStateValue): boolean {
    return true
  }
}
