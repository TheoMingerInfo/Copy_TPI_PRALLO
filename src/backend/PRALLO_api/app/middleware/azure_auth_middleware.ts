import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import User from '#models/user'
import Role from '#models/role'
import env from '#start/env'

export default class AzureAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const authHeader = ctx.request.header('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return ctx.response.unauthorized({ error: 'MISSING_TOKEN', message: 'Token manquant' })
    }

    const token = authHeader.slice(7)

    try {
      // ── Mode dev : Bearer dev_<email> ──────────────────────────────────────
      if (env.get('NODE_ENV') === 'development' && token.startsWith('dev_')) {
        const email = token.slice(4)
        const user = await User.findBy('email', email)
        if (!user) {
          return ctx.response.unauthorized({ error: 'USER_NOT_FOUND', message: 'Utilisateur dev introuvable' })
        }
        ctx.authUser = user
        return next()
      }

      // ── Token Azure (idToken) ──────────────────────────────────────────────
      const payload = await this._validateAzureToken(token)
      console.log('Azure token payload:', payload)
      const azureId: string = payload.oid || payload.sub
      const email: string = payload.preferred_username || payload.upn || payload.email

      if (!email || !azureId) {
        return ctx.response.unauthorized({ error: 'INVALID_TOKEN', message: 'Token invalide' })
      }

      // Chercher l'utilisateur existant
      let user = await User.findBy('azure_id', azureId)
      if (!user) user = await User.findBy('email', email)

      if (user && !user.azureId) {
        user.azureId = azureId
        await user.save()
      }

      // Créer l'utilisateur s'il n'existe pas
      if (!user) {
        const rawFirst = payload.given_name ?? payload.givenName ?? ''
        const rawLast = payload.family_name ?? payload.surname ?? ''
        const parts = email.split('@')[0].split('.')
        const firstName = rawFirst || this._cap(parts[0] ?? 'Prénom')
        const lastName = rawLast || this._cap(parts[1] ?? 'Nom')

        const count = await User.query().count('* as total')
        const total = Number(count[0].$extras.total)
        const roleName = total === 0 ? 'doyen' : 'invite'
        const role = await Role.findByOrFail('name', roleName)

        user = await User.create({
          firstName,
          lastName,
          email,
          azureId,
          roleId: role.id,
          maxProjects: roleName === 'doyen' ? 3 : null,
        })
      }

      ctx.authUser = user
      return next()
    } catch (e) {
      return ctx.response.unauthorized({ error: 'TOKEN_INVALID', message: 'Token invalide ou expiré' })
    }
  }

  private _cap(s: string): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s
  }

  private _validateAzureToken(token: string): Promise<any> {
    const tenantId = env.get('AZURE_TENANT_ID')
    const clientId = env.get('AZURE_CLIENT_ID')

    const client = jwksClient({
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
    })

    const getKey = (header: jwt.JwtHeader, cb: jwt.SigningKeyCallback) => {
      client.getSigningKey(header.kid, (err, key) => {
        if (err) return cb(err)
        cb(null, key?.getPublicKey())
      })
    }

    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        {
          audience: clientId,
          issuer: [
            `https://login.microsoftonline.com/${tenantId}/v2.0`,
            `https://sts.windows.net/${tenantId}/`,
          ],
        },
        (err, decoded) => (err ? reject(err) : resolve(decoded))
      )
    })
  }
}
