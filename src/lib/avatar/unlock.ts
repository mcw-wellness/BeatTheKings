/**
 * Avatar Item Unlock Logic
 * Handles checking unlock eligibility, unlocking items, and purchasing with RP
 */

import { eq, and, or, isNull } from 'drizzle-orm'
import { avatarItems, userUnlockedItems, playerStats } from '@/db/schema'
import { logger } from '@/lib/utils/logger'

type Database = ReturnType<typeof import('@/db').getDb>

// Infer types from schema
type AvatarItem = typeof avatarItems.$inferSelect
type PlayerStats = typeof playerStats.$inferSelect

export interface UnlockProgress {
  matches: { current: number; required: number } | null
  challenges: { current: number; required: number } | null
  invites: { current: number; required: number } | null
  xp: { current: number; required: number } | null
}

export interface ItemWithStatus extends AvatarItem {
  isUnlocked: boolean
  unlockedVia: 'default' | 'achievement' | 'purchase' | null
  canUnlock: boolean
  canPurchase: boolean
  progress: UnlockProgress
}

/**
 * Check if player meets ALL requirements for an item
 */
export function canUnlockItem(stats: PlayerStats, item: AvatarItem): boolean {
  // Default items don't need unlock check
  if (item.isDefault) return true

  // Check each requirement (if specified)
  if (item.requiredMatches !== null && stats.matchesPlayed < item.requiredMatches) {
    return false
  }
  if (item.requiredChallenges !== null && stats.challengesCompleted < item.requiredChallenges) {
    return false
  }
  if (item.requiredInvites !== null && stats.usersInvited < item.requiredInvites) {
    return false
  }
  if (item.requiredXp !== null && stats.totalXp < item.requiredXp) {
    return false
  }

  return true
}

/**
 * Check if player can purchase item with RP
 */
export function canPurchaseItem(stats: PlayerStats, item: AvatarItem): boolean {
  if (item.rpCost === null) return false
  return stats.availableRp >= item.rpCost
}

/**
 * Get unlock progress for an item
 */
export function getUnlockProgress(stats: PlayerStats, item: AvatarItem): UnlockProgress {
  return {
    matches:
      item.requiredMatches !== null
        ? { current: stats.matchesPlayed, required: item.requiredMatches }
        : null,
    challenges:
      item.requiredChallenges !== null
        ? { current: stats.challengesCompleted, required: item.requiredChallenges }
        : null,
    invites:
      item.requiredInvites !== null
        ? { current: stats.usersInvited, required: item.requiredInvites }
        : null,
    xp: item.requiredXp !== null ? { current: stats.totalXp, required: item.requiredXp } : null,
  }
}

/**
 * Format unlock requirement as user-friendly text
 */
export function formatRequirement(item: AvatarItem): string {
  const parts: string[] = []

  if (item.requiredMatches !== null) {
    parts.push(`${item.requiredMatches} matches`)
  }
  if (item.requiredChallenges !== null) {
    parts.push(`${item.requiredChallenges} challenges`)
  }
  if (item.requiredInvites !== null) {
    parts.push(`${item.requiredInvites} invites`)
  }
  if (item.requiredXp !== null) {
    parts.push(`${item.requiredXp} XP`)
  }

  if (parts.length === 0) {
    if (item.rpCost !== null) {
      return `${item.rpCost} RP`
    }
    return 'Default item'
  }

  return parts.join(' + ')
}

/**
 * Get user's player stats
 */
export async function getUserStats(
  db: Database,
  userId: string,
  sportId?: string
): Promise<PlayerStats | null> {
  const conditions = sportId
    ? and(eq(playerStats.userId, userId), eq(playerStats.sportId, sportId))
    : eq(playerStats.userId, userId)

  const [stats] = await db.select().from(playerStats).where(conditions).limit(1)

  return stats || null
}

/**
 * Get all items with unlock status for a user
 */
export async function getItemsWithStatus(
  db: Database,
  userId: string,
  sportId?: string
): Promise<{ items: ItemWithStatus[]; stats: PlayerStats | null }> {
  // Get user's stats
  const stats = await getUserStats(db, userId, sportId)

  // Get all active items (sport-specific + universal items with null sportId)
  const itemConditions = sportId
    ? and(
        eq(avatarItems.isActive, true),
        or(eq(avatarItems.sportId, sportId), isNull(avatarItems.sportId))
      )
    : eq(avatarItems.isActive, true)

  const items = await db.select().from(avatarItems).where(itemConditions)

  // Get user's unlocked items
  const unlockedItems = await db
    .select()
    .from(userUnlockedItems)
    .where(eq(userUnlockedItems.userId, userId))

  const unlockedMap = new Map(unlockedItems.map((u) => [u.itemId, u]))

  // Default stats if none exist
  const defaultStats: PlayerStats = {
    id: '',
    userId,
    sportId: sportId || '',
    totalXp: 0,
    totalRp: 0,
    availableRp: 0,
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    challengesCompleted: 0,
    totalPointsScored: 0,
    threePointMade: 0,
    threePointAttempted: 0,
    freeThrowMade: 0,
    freeThrowAttempted: 0,
    usersInvited: 0,
    updatedAt: null,
  }

  const userStats = stats || defaultStats

  // Build items with status
  const itemsWithStatus: ItemWithStatus[] = items.map((item) => {
    const unlocked = unlockedMap.get(item.id)
    const isUnlocked = !!unlocked
    const canUnlock = !isUnlocked && canUnlockItem(userStats, item)
    const canPurchase = !isUnlocked && canPurchaseItem(userStats, item)
    const progress = getUnlockProgress(userStats, item)

    return {
      ...item,
      isUnlocked,
      unlockedVia: unlocked?.unlockedVia as 'default' | 'achievement' | 'purchase' | null,
      canUnlock,
      canPurchase,
      progress,
    }
  })

  return { items: itemsWithStatus, stats: userStats }
}

/**
 * Unlock a specific item for user
 */
export async function unlockItem(
  db: Database,
  userId: string,
  itemId: string,
  via: 'achievement' | 'purchase'
): Promise<{ success: boolean; message: string; item?: AvatarItem }> {
  // Get item
  const [item] = await db.select().from(avatarItems).where(eq(avatarItems.id, itemId)).limit(1)

  if (!item) {
    return { success: false, message: 'Item not found' }
  }

  // Check if already unlocked
  const [existing] = await db
    .select()
    .from(userUnlockedItems)
    .where(and(eq(userUnlockedItems.userId, userId), eq(userUnlockedItems.itemId, itemId)))
    .limit(1)

  if (existing) {
    return { success: false, message: 'Item already unlocked' }
  }

  // Get user stats
  const stats = await getUserStats(db, userId, item.sportId || undefined)
  const defaultStats: PlayerStats = {
    id: '',
    userId,
    sportId: item.sportId || '',
    totalXp: 0,
    totalRp: 0,
    availableRp: 0,
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    challengesCompleted: 0,
    totalPointsScored: 0,
    threePointMade: 0,
    threePointAttempted: 0,
    freeThrowMade: 0,
    freeThrowAttempted: 0,
    usersInvited: 0,
    updatedAt: null,
  }
  const userStats = stats || defaultStats

  if (via === 'achievement') {
    // Check if meets requirements
    if (!canUnlockItem(userStats, item)) {
      return { success: false, message: 'Requirements not met' }
    }
  } else if (via === 'purchase') {
    // Check if can purchase
    if (!canPurchaseItem(userStats, item)) {
      if (item.rpCost === null) {
        return { success: false, message: 'Item not purchasable' }
      }
      return { success: false, message: 'Insufficient RP' }
    }

    // Deduct RP
    if (stats) {
      await db
        .update(playerStats)
        .set({ availableRp: stats.availableRp - item.rpCost! })
        .where(eq(playerStats.id, stats.id))
    }
  }

  // Create unlock record
  await db.insert(userUnlockedItems).values({
    userId,
    itemId,
    unlockedVia: via,
  })

  logger.info({ userId, itemId, via }, 'Item unlocked')

  return { success: true, message: 'Item unlocked!', item }
}

/**
 * Check and unlock all eligible items for user
 * Called after match/challenge completion
 */
export async function checkAndUnlockEligibleItems(
  db: Database,
  userId: string,
  sportId?: string
): Promise<{ newlyUnlocked: AvatarItem[] }> {
  const { items } = await getItemsWithStatus(db, userId, sportId)

  const newlyUnlocked: AvatarItem[] = []

  for (const item of items) {
    // Skip already unlocked or default items
    if (item.isUnlocked || item.isDefault) continue

    // Check if can unlock via achievement
    if (item.canUnlock) {
      const result = await unlockItem(db, userId, item.id, 'achievement')
      if (result.success && result.item) {
        newlyUnlocked.push(result.item)
      }
    }
  }

  if (newlyUnlocked.length > 0) {
    logger.info({ userId, count: newlyUnlocked.length }, 'Auto-unlocked items')
  }

  return { newlyUnlocked }
}
