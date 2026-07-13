import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'role_state_permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE')
      table.integer('state_id').unsigned().notNullable().references('id').inTable('states').onDelete('CASCADE')
      table.json('permissions').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['role_id', 'state_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
