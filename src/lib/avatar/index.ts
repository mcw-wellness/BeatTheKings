import { eq } from 'drizzle-orm'
import {
  avatars,
  avatarItems,
  avatarEquipments,
  userUnlockedItems,
  playerStats,
  sports,
  users,
} from '@/db/schema'
import type { Database } from '@/db'

// ===========================================
// CONSTANTS
// ===========================================

export const VALID_SKIN_TONES = ['light', 'medium-light', 'medium', 'medium-dark', 'dark'] as const
export const VALID_HAIR_STYLES = [
  'short',
  'medium',
  'long',
  'bald',
  'afro',
  'braids',
  'dreads',
  'mohawk',
] as const
export const VALID_HAIR_COLORS = ['black', 'brown', 'blonde', 'red', 'gray', 'white'] as const

export type SkinTone = (typeof VALID_SKIN_TONES)[number]
export type HairStyle = (typeof VALID_HAIR_STYLES)[number]
export type HairColor = (typeof VALID_HAIR_COLORS)[number]

// ===========================================
// TYPES
// ===========================================

export interface AvatarCreateInput {
  skinTone: SkinTone
  hairStyle: HairStyle
  hairColor: HairColor
  imageUrl?: string
}

export interface AvatarUpdateInput {
  skinTone?: SkinTone
  hairStyle?: HairStyle
  hairColor?: HairColor
  imageUrl?: string
}

// ===========================================
// VALIDATION
// ===========================================

/**
 * Validate avatar creation input
 */
export function validateAvatarInput(
  data: unknown
): { valid: true; data: AvatarCreateInput } | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: { _form: 'Invalid request body' } }
  }

  const input = data as Record<string, unknown>

  // Skin tone validation
  if (!input.skinTone || typeof input.skinTone !== 'string') {
    errors.skinTone = 'Skin tone is required'
  } else if (!VALID_SKIN_TONES.includes(input.skinTone as SkinTone)) {
    errors.skinTone = `Invalid skin tone. Must be one of: ${VALID_SKIN_TONES.join(', ')}`
  }

  // Hair style validation
  if (!input.hairStyle || typeof input.hairStyle !== 'string') {
    errors.hairStyle = 'Hair style is required'
  } else if (!VALID_HAIR_STYLES.includes(input.hairStyle as HairStyle)) {
    errors.hairStyle = `Invalid hair style. Must be one of: ${VALID_HAIR_STYLES.join(', ')}`
  }

  // Hair color validation
  if (!input.hairColor || typeof input.hairColor !== 'string') {
    errors.hairColor = 'Hair color is required'
  } else if (!VALID_HAIR_COLORS.includes(input.hairColor as HairColor)) {
    errors.hairColor = `Invalid hair color. Must be one of: ${VALID_HAIR_COLORS.join(', ')}`
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    data: {
      skinTone: input.skinTone as SkinTone,
      hairStyle: input.hairStyle as HairStyle,
      hairColor: input.hairColor as HairColor,
    },
  }
}

/**
 * Validate avatar update input (partial update allowed)
 */
export function validateAvatarUpdateInput(
  data: unknown
): { valid: true; data: AvatarUpdateInput } | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: { _form: 'Invalid request body' } }
  }

  const input = data as Record<string, unknown>
  const updateData: AvatarUpdateInput = {}

  // Skin tone validation (optional)
  if (input.skinTone !== undefined) {
    if (typeof input.skinTone !== 'string') {
      errors.skinTone = 'Skin tone must be a string'
    } else if (!VALID_SKIN_TONES.includes(input.skinTone as SkinTone)) {
      errors.skinTone = `Invalid skin tone. Must be one of: ${VALID_SKIN_TONES.join(', ')}`
    } else {
      updateData.skinTone = input.skinTone as SkinTone
    }
  }

  // Hair style validation (optional)
  if (input.hairStyle !== undefined) {
    if (typeof input.hairStyle !== 'string') {
      errors.hairStyle = 'Hair style must be a string'
    } else if (!VALID_HAIR_STYLES.includes(input.hairStyle as HairStyle)) {
      errors.hairStyle = `Invalid hair style. Must be one of: ${VALID_HAIR_STYLES.join(', ')}`
    } else {
      updateData.hairStyle = input.hairStyle as HairStyle
    }
  }

  // Hair color validation (optional)
  if (input.hairColor !== undefined) {
    if (typeof input.hairColor !== 'string') {
      errors.hairColor = 'Hair color must be a string'
    } else if (!VALID_HAIR_COLORS.includes(input.hairColor as HairColor)) {
      errors.hairColor = `Invalid hair color. Must be one of: ${VALID_HAIR_COLORS.join(', ')}`
    } else {
      updateData.hairColor = input.hairColor as HairColor
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors }
  }

  if (Object.keys(updateData).length === 0) {
    return { valid: false, errors: { _form: 'At least one field is required' } }
  }

  return { valid: true, data: updateData }
}

// ===========================================
// AVATAR CRUD
// ===========================================

/**
 * Check if user already has an avatar
 */
export async function avatarExists(db: Database, userId: string): Promise<boolean> {
  const [avatar] = await db
    .select({ id: avatars.id })
    .from(avatars)
    .where(eq(avatars.userId, userId))
    .limit(1)
  return !!avatar
}

/**
 * Get user's avatar
 */
export async function getAvatar(db: Database, userId: string) {
  const [avatar] = await db.select().from(avatars).where(eq(avatars.userId, userId)).limit(1)
  return avatar || null
}

/**
 * Create a new avatar
 */
export async function createAvatar(db: Database, userId: string, data: AvatarCreateInput) {
  const [avatar] = await db
    .insert(avatars)
    .values({
      userId,
      skinTone: data.skinTone,
      hairStyle: data.hairStyle,
      hairColor: data.hairColor,
      imageUrl: data.imageUrl,
    })
    .returning()

  return avatar
}

/**
 * Update avatar image URL
 */
export async function updateAvatarImageUrl(db: Database, avatarId: string, imageUrl: string) {
  const [updated] = await db
    .update(avatars)
    .set({
      imageUrl,
      updatedAt: new Date(),
    })
    .where(eq(avatars.id, avatarId))
    .returning()

  return updated
}

/**
 * Update an existing avatar
 */
export async function updateAvatar(db: Database, avatarId: string, data: AvatarUpdateInput) {
  const [updated] = await db
    .update(avatars)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(avatars.id, avatarId))
    .returning()

  return updated
}

// ===========================================
// DEFAULT ITEMS & EQUIPMENT
// ===========================================

/**
 * Get all default avatar items
 */
export async function getDefaultItems(db: Database) {
  return db.select().from(avatarItems).where(eq(avatarItems.isDefault, true))
}

/**
 * Unlock default items for a user
 */
export async function unlockDefaultItems(db: Database, userId: string) {
  const defaultItems = await getDefaultItems(db)

  if (defaultItems.length === 0) {
    return []
  }

  const unlockRecords = defaultItems.map((item) => ({
    userId,
    itemId: item.id,
    unlockedVia: 'default' as const,
  }))

  return db.insert(userUnlockedItems).values(unlockRecords).returning()
}

/**
 * Get basketball sport ID
 */
export async function getBasketballSportId(db: Database): Promise<string | null> {
  const [sport] = await db
    .select({ id: sports.id })
    .from(sports)
    .where(eq(sports.slug, 'basketball'))
    .limit(1)
  return sport?.id || null
}

/**
 * Create default equipment for basketball
 */
export async function createDefaultEquipment(
  db: Database,
  avatarId: string,
  sportId: string,
  defaultItems: { id: string; itemType: string }[],
  jerseyNumber?: number
) {
  const jersey = defaultItems.find((i) => i.itemType === 'jersey')
  const shorts = defaultItems.find((i) => i.itemType === 'shorts')
  const shoes = defaultItems.find((i) => i.itemType === 'shoes')

  const [equipment] = await db
    .insert(avatarEquipments)
    .values({
      avatarId,
      sportId,
      jerseyItemId: jersey?.id || null,
      shortsItemId: shorts?.id || null,
      shoesItemId: shoes?.id || null,
      jerseyNumber: jerseyNumber ?? 10,
    })
    .returning()

  return equipment
}

/**
 * Create or update equipment for an avatar (upsert)
 */
export async function upsertEquipment(
  db: Database,
  avatarId: string,
  sportId: string,
  defaultItems: { id: string; itemType: string }[],
  jerseyNumber?: number
) {
  const jersey = defaultItems.find((i) => i.itemType === 'jersey')
  const shorts = defaultItems.find((i) => i.itemType === 'shorts')
  const shoes = defaultItems.find((i) => i.itemType === 'shoes')

  const [equipment] = await db
    .insert(avatarEquipments)
    .values({
      avatarId,
      sportId,
      jerseyItemId: jersey?.id || null,
      shortsItemId: shorts?.id || null,
      shoesItemId: shoes?.id || null,
      jerseyNumber: jerseyNumber ?? 10,
    })
    .onConflictDoUpdate({
      target: [avatarEquipments.avatarId, avatarEquipments.sportId],
      set: {
        jerseyNumber: jerseyNumber ?? 10,
        updatedAt: new Date(),
      },
    })
    .returning()

  return equipment
}

// ===========================================
// AVATAR WITH STATS
// ===========================================

/**
 * Get avatar with equipment and player stats
 */
export async function getAvatarWithStats(db: Database, userId: string) {
  // Get avatar
  const avatar = await getAvatar(db, userId)
  if (!avatar) return null

  // Get equipment with item details
  const equipmentRows = await db
    .select({
      equipment: avatarEquipments,
      sport: sports,
      jersey: {
        id: avatarItems.id,
        name: avatarItems.name,
        imageUrl: avatarItems.imageUrl,
      },
    })
    .from(avatarEquipments)
    .leftJoin(sports, eq(avatarEquipments.sportId, sports.id))
    .leftJoin(avatarItems, eq(avatarEquipments.jerseyItemId, avatarItems.id))
    .where(eq(avatarEquipments.avatarId, avatar.id))

  // Get player stats
  const statsRows = await db
    .select({
      stats: playerStats,
      sport: sports,
    })
    .from(playerStats)
    .leftJoin(sports, eq(playerStats.sportId, sports.id))
    .where(eq(playerStats.userId, userId))

  // Format equipment by sport
  const equipment: Record<
    string,
    {
      jerseyNumber: number | null
      jersey: { id: string; name: string; imageUrl: string | null } | null
    }
  > = {}

  for (const row of equipmentRows) {
    if (row.sport) {
      equipment[row.sport.slug] = {
        jerseyNumber: row.equipment.jerseyNumber,
        jersey: row.jersey,
      }
    }
  }

  // Format stats by sport
  const stats: Record<
    string,
    {
      totalXp: number
      totalRp: number
      matchesWon: number
      matchesLost: number
      winRate: number
      challengesCompleted: number
      totalPointsScored: number
    }
  > = {}

  for (const row of statsRows) {
    if (row.sport && row.stats) {
      const played = row.stats.matchesPlayed || 0
      const won = row.stats.matchesWon || 0
      stats[row.sport.slug] = {
        totalXp: row.stats.totalXp,
        totalRp: row.stats.totalRp,
        matchesWon: won,
        matchesLost: row.stats.matchesLost,
        winRate: played > 0 ? Math.round((won / played) * 100) : 0,
        challengesCompleted: row.stats.challengesCompleted,
        totalPointsScored: row.stats.totalPointsScored,
      }
    }
  }

  return {
    avatar: {
      id: avatar.id,
      skinTone: avatar.skinTone,
      hairStyle: avatar.hairStyle,
      hairColor: avatar.hairColor,
      imageUrl: avatar.imageUrl,
    },
    equipment,
    stats,
  }
}

/**
 * Set user's hasCreatedAvatar to true
 */
export async function markAvatarCreated(db: Database, userId: string) {
  const [updated] = await db
    .update(users)
    .set({ hasCreatedAvatar: true, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning()

  return updated
}

/**
 * Get user's unlocked items for a sport
 */
export async function getUserUnlockedItems(db: Database, userId: string, sportId?: string) {
  const query = db
    .select({
      unlocked: userUnlockedItems,
      item: avatarItems,
    })
    .from(userUnlockedItems)
    .innerJoin(avatarItems, eq(userUnlockedItems.itemId, avatarItems.id))
    .where(eq(userUnlockedItems.userId, userId))

  const results = await query

  // Filter by sport if specified
  if (sportId) {
    return results.filter((r) => r.item.sportId === sportId || r.item.sportId === null)
  }

  return results
}
