import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projects'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('title', 30).notNullable()
      table.text('description').notNullable()
      table.integer('professor_id').unsigned().notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.boolean('is_mandatory').notNullable().defaultTo(false)
      table.tinyint('max_students').unsigned().notNullable().defaultTo(1)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
