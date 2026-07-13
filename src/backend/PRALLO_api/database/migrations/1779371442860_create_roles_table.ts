import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name', 50).notNullable().unique()
      table.string('label', 100).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
