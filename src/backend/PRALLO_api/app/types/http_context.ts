import User from '#models/user'
import type { Permissions } from '#models/role_state_permission'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    authUser?: User
    permissions: Permissions | null
  }
}
