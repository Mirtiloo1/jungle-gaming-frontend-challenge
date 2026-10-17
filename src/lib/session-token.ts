const key = 'kurio.session-token'
export const readSessionToken = () => localStorage.getItem(key)
export function writeSessionToken(token: string | null) {
  if (token) localStorage.setItem(key, token)
  else localStorage.removeItem(key)
}

export function readGuestId() {
  const key = 'kurio.guest-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}
