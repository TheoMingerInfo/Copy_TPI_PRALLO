import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'votes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('student_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('project_id').unsigned().notNullable().references('id').inTable('projects').onDelete('CASCADE')
      table.tinyint('priority').unsigned().notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['student_id', 'project_id'])
      table.unique(['student_id', 'priority'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
