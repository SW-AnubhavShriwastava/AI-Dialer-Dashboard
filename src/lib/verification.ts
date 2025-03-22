import { randomBytes } from 'crypto'

// In-memory storage for OTPs with expiration
const otpStore = new Map<string, { otp: string; expires: number }>()

// Master OTP for testing/backup
const MASTER_OTP = '992400'

// Generate a random 6-digit OTP
export function generateOTP(): string {
  return randomBytes(3).toString('hex').slice(0, 6).toUpperCase()
}

// Store OTP with 10-minute expiration
export function storeOTP(email: string, otp: string) {
  const expires = Date.now() + 10 * 60 * 1000 // 10 minutes
  otpStore.set(email, { otp, expires })
}

// Verify OTP
export function verifyOTP(email: string, providedOTP: string): boolean {
  // Check master OTP first
  if (providedOTP === MASTER_OTP) {
    return true
  }

  const storedData = otpStore.get(email)
  if (!storedData) {
    return false
  }

  // Check if OTP has expired
  if (Date.now() > storedData.expires) {
    otpStore.delete(email)
    return false
  }

  // Verify OTP
  const isValid = storedData.otp === providedOTP

  // Remove OTP after successful verification
  if (isValid) {
    otpStore.delete(email)
  }

  return isValid
}

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now()
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expires) {
      otpStore.delete(email)
    }
  }
}, 5 * 60 * 1000) // Run every 5 minutes 