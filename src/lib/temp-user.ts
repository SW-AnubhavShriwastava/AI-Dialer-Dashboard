// Store for users pending email verification
const pendingUsers = new Map<string, {
  name: string
  email: string
  username: string
  password: string
  expires: number
}>()

// Store pending user data with 10-minute expiration
export function storePendingUser(data: {
  name: string
  email: string
  username: string
  password: string
}) {
  const expires = Date.now() + 10 * 60 * 1000 // 10 minutes
  pendingUsers.set(data.email, { ...data, expires })
}

// Get pending user data
export function getPendingUser(email: string) {
  const userData = pendingUsers.get(email)
  if (!userData) return null

  // Check if data has expired
  if (Date.now() > userData.expires) {
    pendingUsers.delete(email)
    return null
  }

  return userData
}

// Remove pending user data
export function removePendingUser(email: string) {
  pendingUsers.delete(email)
}

// Clean up expired pending users periodically
setInterval(() => {
  const now = Date.now()
  for (const [email, data] of pendingUsers.entries()) {
    if (now > data.expires) {
      pendingUsers.delete(email)
    }
  }
}, 5 * 60 * 1000) // Run every 5 minutes 