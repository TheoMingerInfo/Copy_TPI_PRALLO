import type { HttpContext } from '@adonisjs/core/http'
import AppState from '#models/app_state'
import RoleStatePermission from '#models/role_state_permission'

export default class AuthController {
  async me({ authUser, response }: HttpContext) {
    const user = authUser!
    await user.load('skills')
    await user.load('role')

    const currentState = await AppState.currentState()
    const permissions = await RoleStatePermission.getPermissions(user.roleId, currentState)

    return response.ok({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role.name,
        maxProjects: user.maxProjects,
        skills: user.skills,
      },
      appState: currentState,
      permissions,
    })
  }

  async logout({ response }: HttpContext) {
    // La session est gérée côté client (MSAL + token en mémoire)
    return response.ok({ message: 'Déconnecté' })
  }
}
