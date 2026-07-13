// Module partagé pour éviter les dépendances circulaires entre api.ts et auth.ts
// L'auth store enregistre une fonction qui retourne un token frais à chaque appel.

type TokenGetter = () => Promise<string | null>

let _getter: TokenGetter = async () => null

export function setTokenGetter(fn: TokenGetter): void {
  _getter = fn
}

export async function getToken(): Promise<string | null> {
  return _getter()
}
