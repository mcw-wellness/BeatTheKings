import { eq } from 'drizzle-orm'
import { users, cities } from '@/db/schema'
import type { Database } from '@/db'
import { calculateAge, getAgeGroup } from '@/lib/utils/date'

/**
 * Profile update input type - all fields optional for flexible updates
 */
export interface ProfileUpdateInput {
  name?: string
  dateOfBirth?: string
  gender?: 'male' | 'female'
  cityId?: string
}

/**
 * Find user by email
 */
export async function findUserByEmail(db: Database, email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return user || null
}

/**
 * Find user by ID
 */
export async function findUserById(db: Database, id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return user || null
}

/**
 * Create a new user from OAuth sign-in
 */
export async function createUserFromOAuth(
  db: Database,
  data: {
    email: string
    name?: string | null
  }
) {
  const [user] = await db
    .insert(users)
    .values({
      email: data.email,
      name: data.name || null,
      hasCreatedAvatar: false,
    })
    .returning()

  return user
}

/**
 * Get or create user from OAuth sign-in
 * Returns existing user if email exists, otherwise creates new user
 */
export async function getOrCreateUser(
  db: Database,
  data: {
    email: string
    name?: string | null
  }
) {
  // First try to find existing user
  const existingUser = await findUserByEmail(db, data.email)

  if (existingUser) {
    return { user: existingUser, isNewUser: false }
  }

  // Create new user
  const newUser = await createUserFromOAuth(db, data)
  return { user: newUser, isNewUser: true }
}

/**
 * Update user's hasCreatedAvatar status
 */
export async function updateUserAvatarStatus(
  db: Database,
  userId: string,
  hasCreatedAvatar: boolean
) {
  const [updated] = await db
    .update(users)
    .set({ hasCreatedAvatar, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning()

  return updated
}

/**
 * Validate profile update input - validates only provided fields
 */
export function validateProfileInput(
  data: unknown
): { valid: true; data: ProfileUpdateInput } | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: { _form: 'Invalid request body' } }
  }

  const input = data as Record<string, unknown>
  const result: ProfileUpdateInput = {}

  // Name validation (if provided)
  if (input.name !== undefined) {
    if (typeof input.name !== 'string') {
      errors.name = 'Name must be a string'
    } else if (input.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    } else if (input.name.trim().length > 100) {
      errors.name = 'Name must be less than 100 characters'
    } else {
      result.name = input.name.trim()
    }
  }

  // Date of birth validation (if provided)
  if (input.dateOfBirth !== undefined) {
    if (typeof input.dateOfBirth !== 'string') {
      errors.dateOfBirth = 'Date of birth must be a string'
    } else {
      const dob = new Date(input.dateOfBirth)
      if (isNaN(dob.getTime())) {
        errors.dateOfBirth = 'Invalid date format'
      } else {
        const age = calculateAge(dob)
        if (age < 5) {
          errors.dateOfBirth = 'Must be at least 5 years old'
        } else if (age > 120) {
          errors.dateOfBirth = 'Invalid date of birth'
        } else {
          result.dateOfBirth = input.dateOfBirth
        }
      }
    }
  }

  // Gender validation (if provided)
  if (input.gender !== undefined) {
    const validGenders = ['male', 'female']
    if (typeof input.gender !== 'string') {
      errors.gender = 'Gender must be a string'
    } else if (!validGenders.includes(input.gender.toLowerCase())) {
      errors.gender = 'Invalid gender'
    } else {
      result.gender = input.gender.toLowerCase() as 'male' | 'female'
    }
  }

  // City ID validation (if provided)
  if (input.cityId !== undefined) {
    if (typeof input.cityId !== 'string') {
      errors.cityId = 'City ID must be a string'
    } else {
      result.cityId = input.cityId
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors }
  }

  if (Object.keys(result).length === 0) {
    return { valid: false, errors: { _form: 'No fields to update' } }
  }

  return { valid: true, data: result }
}

/**
 * Update user profile - only updates provided fields
 */
export async function updateUserProfile(db: Database, userId: string, data: ProfileUpdateInput) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  if (data.name !== undefined) {
    updateData.name = data.name
  }

  if (data.dateOfBirth !== undefined) {
    updateData.dateOfBirth = data.dateOfBirth
    updateData.ageGroup = getAgeGroup(new Date(data.dateOfBirth))
  }

  if (data.gender !== undefined) {
    updateData.gender = data.gender
  }

  if (data.cityId !== undefined) {
    updateData.cityId = data.cityId
  }

  const [updated] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning()

  return updated
}

/**
 * Get user profile with city info
 */
export async function getUserProfile(db: Database, userId: string) {
  const [result] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      dateOfBirth: users.dateOfBirth,
      ageGroup: users.ageGroup,
      gender: users.gender,
      cityId: users.cityId,
      hasCreatedAvatar: users.hasCreatedAvatar,
      createdAt: users.createdAt,
      city: {
        id: cities.id,
        name: cities.name,
      },
    })
    .from(users)
    .leftJoin(cities, eq(users.cityId, cities.id))
    .where(eq(users.id, userId))
    .limit(1)

  return result || null
}

/**
 * Check if a city exists
 */
export async function cityExists(db: Database, cityId: string): Promise<boolean> {
  const [city] = await db
    .select({ id: cities.id })
    .from(cities)
    .where(eq(cities.id, cityId))
    .limit(1)
  return !!city
}
