import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'project_skills'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('project_id').unsigned().notNullable().references('id').inTable('projects').onDelete('CASCADE')
      table.integer('skill_id').unsigned().notNullable().references('id').inTable('skills').onDelete('CASCADE')
      table.primary(['project_id', 'skill_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
