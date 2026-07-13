import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AppState from '#models/app_state'
import RoleStatePermission from '#models/role_state_permission'
import '#types/http_context'

export default class SiteAccessMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.authUser!
    const currentState = await AppState.currentState()

    ctx.permissions = await RoleStatePermission.getPermissions(user.roleId, currentState)

    if (!ctx.permissions?.accessSite) {
      await user.load('role')
      return ctx.response.forbidden({
        error: 'SITE_ACCESS_DENIED',
        message: `Accès au site non autorisé pour le rôle "${user.role.name}" en état "${currentState}"`,
        state: currentState,
        role: user.role.name,
      })
    }

    return next()
  }
}
