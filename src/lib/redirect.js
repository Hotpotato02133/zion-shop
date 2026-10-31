const KEY = 'zion_post_auth_redirect'
const DEFAULT_REDIRECT = '/products'

// Only same-site absolute paths are allowed (blocks open redirects such as //evil.com)
const isSafePath = (value) => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')

/** Remember where the user was heading before they were asked to sign in. */
export const rememberRedirect = (path) => {
  if (!isSafePath(path)) return
  try {
    sessionStorage.setItem(KEY, path)
  } catch {
    // sessionStorage unavailable; fall back to the default destination
  }
}

/** Read (without clearing) the pending post-auth destination. */
export const peekRedirect = (fallback = DEFAULT_REDIRECT) => {
  try {
    const stored = sessionStorage.getItem(KEY)
    return isSafePath(stored) ? stored : fallback
  } catch {
    return fallback
  }
}

export const clearRedirect = () => {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

/** Build the login URL that returns the user to `path` afterwards. */
export const loginUrlFor = (path) => `/login?redirect=${encodeURIComponent(path)}`

/** Pick up `?redirect=` from the current URL, persist it, and return the destination. */
export const captureRedirect = (search) => {
  const fromUrl = new URLSearchParams(search).get('redirect')
  if (isSafePath(fromUrl)) rememberRedirect(fromUrl)
  return peekRedirect()
}
