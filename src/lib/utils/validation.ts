/**
 * Validation utility functions
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Check if a string is not empty after trimming
 */
export function isNotEmpty(str: string | null | undefined): boolean {
  return str !== null && str !== undefined && str.trim().length > 0
}

/**
 * Validate age is within acceptable range
 */
export function isValidAge(age: number): boolean {
  return age >= 5 && age <= 120
}

/**
 * Validate coordinates (latitude and longitude)
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

/**
 * Validate score value (non-negative integer)
 */
export function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= 0
}

/**
 * Sanitize string input (remove potentially dangerous characters)
 */
export function sanitizeString(str: string): string {
  return str.replace(/[<>]/g, '').trim()
}

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Calculate age group from age
 */
export type AgeGroup = 'Under-13' | '13-15' | '16-18' | '19-21' | '22-25' | '26+'

export function calculateAgeGroup(age: number): AgeGroup {
  if (age < 13) return 'Under-13'
  if (age <= 15) return '13-15'
  if (age <= 18) return '16-18'
  if (age <= 21) return '19-21'
  if (age <= 25) return '22-25'
  return '26+'
}
