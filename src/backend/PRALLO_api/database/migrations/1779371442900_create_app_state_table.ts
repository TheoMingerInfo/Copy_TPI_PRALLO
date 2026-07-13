import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'app_state'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.tinyint('id').unsigned().primary().defaultTo(1)
      table
        .integer('state_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('states')
        .onDelete('RESTRICT')
      table.integer('updated_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
