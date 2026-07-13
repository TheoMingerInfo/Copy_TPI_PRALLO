import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Permissions } from '#models/role_state_permission'
import '#types/http_context'

export default class CheckPermissionMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { permission: keyof Permissions | (keyof Permissions)[] }
  ) {
    const perms = ctx.permissions
    const required = Array.isArray(options.permission) ? options.permission : [options.permission]
    const allowed = required.some((p) => perms?.[p])

    if (!allowed) {
      return ctx.response.forbidden({
        error: 'PERMISSION_DENIED',
        message: `Action non autorisée en état actuel`,
      })
    }

    return next()
  }
}
